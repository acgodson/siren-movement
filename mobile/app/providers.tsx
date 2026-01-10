'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';
import { TRPCProvider } from "@/trpc/client";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.PRIVY_APP_ID || 'cm09c0kux05vl7269wln6qrff'}
            config={{
                loginMethods: ['email', 'google'],

                embeddedWallets: {
                    "ethereum": {
                        createOnLogin: 'users-without-wallets',
                    }
                },
                appearance: {
                    theme: 'light',
                    accentColor: '#6366f1',
                    logo: '/favicon.ico',
                },
            }}
        >
            <TRPCProvider>
                {children}
            </TRPCProvider>
        </PrivyProvider>
    );
}

