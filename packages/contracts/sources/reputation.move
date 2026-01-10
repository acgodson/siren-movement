module siren::reputation {
    use std::signer;
    use aptos_framework::timestamp;

    const E_PROFILE_NOT_FOUND: u64 = 1;
    const E_PROFILE_ALREADY_EXISTS: u64 = 2;

    struct UserProfile has key {
        reputation_score: u64,
        total_signals: u64,
        joined_at: u64,
    }

    public entry fun init_profile(user: &signer) {
        let user_addr = signer::address_of(user);
        assert!(!exists<UserProfile>(user_addr), E_PROFILE_ALREADY_EXISTS);

        move_to(user, UserProfile {
            reputation_score: 0,
            total_signals: 0,
            joined_at: timestamp::now_seconds(),
        });
    }

    public fun reward_signal_submission(user_addr: address) acquires UserProfile {
        assert!(exists<UserProfile>(user_addr), E_PROFILE_NOT_FOUND);

        let profile = borrow_global_mut<UserProfile>(user_addr);
        profile.reputation_score = profile.reputation_score + 10;
        profile.total_signals = profile.total_signals + 1;
    }

    #[view]
    public fun get_reputation(user_addr: address): u64 acquires UserProfile {
        if (!exists<UserProfile>(user_addr)) {
            return 0
        };
        borrow_global<UserProfile>(user_addr).reputation_score
    }

    #[view]
    public fun get_profile(user_addr: address): (u64, u64, u64) acquires UserProfile {
        assert!(exists<UserProfile>(user_addr), E_PROFILE_NOT_FOUND);
        let profile = borrow_global<UserProfile>(user_addr);
        (profile.reputation_score, profile.total_signals, profile.joined_at)
    }

    #[test(aptos_framework = @0x1, user = @0x123)]
    public fun test_init_profile(aptos_framework: &signer, user: &signer) acquires UserProfile {
        let user_addr = signer::address_of(user);
        timestamp::set_time_has_started_for_testing(aptos_framework);
        aptos_framework::account::create_account_for_test(user_addr);

        init_profile(user);

        let rep = get_reputation(user_addr);
        assert!(rep == 0, 0);
    }

    #[test(aptos_framework = @0x1, user = @0x123)]
    public fun test_reward(aptos_framework: &signer, user: &signer) acquires UserProfile {
        let user_addr = signer::address_of(user);
        timestamp::set_time_has_started_for_testing(aptos_framework);
        aptos_framework::account::create_account_for_test(user_addr);

        init_profile(user);
        reward_signal_submission(user_addr);

        let rep = get_reputation(user_addr);
        assert!(rep == 10, 1);
    }
}
