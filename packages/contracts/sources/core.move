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
        confirmations: u64,
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

    fun calculate_distance(lat1: u64, lon1: u64, lat2: u64, lon2: u64): u64 {
        let lat_diff = if (lat1 > lat2) { lat1 - lat2 } else { lat2 - lat1 };
        let lon_diff = if (lon1 > lon2) { lon1 - lon2 } else { lon2 - lon1 };

        let lat_diff_sq = lat_diff * lat_diff;
        let lon_diff_sq = lon_diff * lon_diff;

        lat_diff_sq + lon_diff_sq
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

        let proximity_threshold = 100000;
        let matched_signal_index: u64 = 999999999;
        let found_match = false;

        let signals = &mut registry.signals;
        let len = vector::length(signals);
        let i = 0;

        while (i < len) {
            let signal = vector::borrow(signals, i);

            if (signal.signal_type == signal_type) {
                let distance = calculate_distance(lat, lon, signal.lat, signal.lon);

                if (distance < proximity_threshold) {
                    matched_signal_index = i;
                    found_match = true;
                    break
                };
            };

            i = i + 1;
        };

        if (found_match) {
            let matched_signal = vector::borrow_mut(signals, matched_signal_index);
            let original_reporter = matched_signal.reporter;

            matched_signal.confirmations = matched_signal.confirmations + 1;

            let new_confidence = matched_signal.confidence + 10;
            if (new_confidence > 100) {
                new_confidence = 100;
            };
            matched_signal.confidence = (new_confidence as u8);

            reputation::reward_signal_confirmation(user_addr);
            reputation::reward_signal_confirmation(original_reporter);
        } else {
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
                confirmations: 0,
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
        };
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

    #[test(aptos_framework = @0x1, admin = @0x100, user1 = @0x200, user2 = @0x300)]
    public fun test_submit_and_match_signal(
        aptos_framework: &signer,
        admin: &signer,
        user1: &signer,
        user2: &signer
    ) acquires SignalRegistry {
        use aptos_framework::account;

        let admin_addr = signer::address_of(admin);
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);

        timestamp::set_time_has_started_for_testing(aptos_framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);

        reputation::init_profile(user1);
        reputation::init_profile(user2);
        init_registry(admin);

        submit_signal(user1, admin_addr, 0, 37774900, 122419400);

        let count = get_signal_count(admin_addr);
        assert!(count == 1, 0);

        let signal = get_signal(admin_addr, 1);
        assert!(signal.reporter == user1_addr, 1);
        assert!(signal.signal_type == 0, 2);
        assert!(signal.confidence == 50, 3);
        assert!(signal.confirmations == 0, 4);

        submit_signal(user2, admin_addr, 0, 37774910, 122419410);

        let count2 = get_signal_count(admin_addr);
        assert!(count2 == 1, 5);

        let matched_signal = get_signal(admin_addr, 1);
        assert!(matched_signal.confirmations == 1, 6);
        assert!(matched_signal.confidence == 60, 7);
    }
}
