module siren::core {
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;
    use siren::reputation;

    const E_REGISTRY_NOT_FOUND: u64 = 1;
    const E_SIGNAL_NOT_FOUND: u64 = 2;
    const E_INVALID_SIGNAL_TYPE: u64 = 3;

    struct Signal has store, drop, copy {
        id: u64,
        reporter: address,
        signal_type: u8,
        lat: u64,
        lon: u64,
        timestamp: u64,
        confidence: u8,
    }

    struct SignalRegistry has key {
        signals: vector<Signal>,
        next_signal_id: u64,
        signal_created_events: event::EventHandle<SignalCreated>,
    }

    #[event]
    struct SignalCreated has drop, store {
        signal_id: u64,
        reporter: address,
        signal_type: u8,
        lat: u64,
        lon: u64,
        timestamp: u64,
    }

    public entry fun init_registry(admin: &signer) {
        move_to(admin, SignalRegistry {
            signals: vector::empty<Signal>(),
            next_signal_id: 1,
            signal_created_events: account::new_event_handle<SignalCreated>(admin),
        });
    }

    public entry fun submit_signal(
        user: &signer,
        registry_addr: address,
        signal_type: u8,
        lat: u64,
        lon: u64
    ) acquires SignalRegistry {
        assert!(signal_type <= 3, E_INVALID_SIGNAL_TYPE);
        assert!(exists<SignalRegistry>(registry_addr), E_REGISTRY_NOT_FOUND);

        let user_addr = signer::address_of(user);
        let registry = borrow_global_mut<SignalRegistry>(registry_addr);

        let signal_id = registry.next_signal_id;
        registry.next_signal_id = signal_id + 1;

        let signal = Signal {
            id: signal_id,
            reporter: user_addr,
            signal_type,
            lat,
            lon,
            timestamp: timestamp::now_seconds(),
            confidence: 50,
        };

        vector::push_back(&mut registry.signals, signal);

        reputation::reward_signal_submission(user_addr);

        event::emit_event(&mut registry.signal_created_events, SignalCreated {
            signal_id,
            reporter: user_addr,
            signal_type,
            lat,
            lon,
            timestamp: signal.timestamp,
        });
    }

    #[view]
    public fun get_all_signals(registry_addr: address): vector<Signal> acquires SignalRegistry {
        assert!(exists<SignalRegistry>(registry_addr), E_REGISTRY_NOT_FOUND);
        *&borrow_global<SignalRegistry>(registry_addr).signals
    }

    #[view]
    public fun get_signal(registry_addr: address, signal_id: u64): Signal acquires SignalRegistry {
        assert!(exists<SignalRegistry>(registry_addr), E_REGISTRY_NOT_FOUND);

        let registry = borrow_global<SignalRegistry>(registry_addr);
        let signals = &registry.signals;
        let len = vector::length(signals);

        let i = 0;
        while (i < len) {
            let signal = vector::borrow(signals, i);
            if (signal.id == signal_id) {
                return *signal
            };
            i = i + 1;
        };

        abort E_SIGNAL_NOT_FOUND
    }

    #[view]
    public fun get_signal_count(registry_addr: address): u64 acquires SignalRegistry {
        if (!exists<SignalRegistry>(registry_addr)) {
            return 0
        };
        vector::length(&borrow_global<SignalRegistry>(registry_addr).signals)
    }

    #[test(aptos_framework = @0x1, admin = @0x100, user = @0x200)]
    public fun test_submit_signal(aptos_framework: &signer, admin: &signer, user: &signer) acquires SignalRegistry {
        use aptos_framework::account;

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);

        timestamp::set_time_has_started_for_testing(aptos_framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(user_addr);

        reputation::init_profile(user);
        init_registry(admin);

        submit_signal(user, admin_addr, 0, 37774900, 122419400);

        let count = get_signal_count(admin_addr);
        assert!(count == 1, 0);

        let signal = get_signal(admin_addr, 1);
        assert!(signal.reporter == user_addr, 1);
        assert!(signal.signal_type == 0, 2);
    }
}
