import { adminClient, customSessionClient, inferAdditionalFields, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import type { auth as baseAuth } from '@/lib/auth'

export const authClient = createAuthClient({
    plugins: [
        inferAdditionalFields<typeof baseAuth>(),
        adminClient(),
        organizationClient({
            teams: {
                enabled: true,
            },
        }),
        customSessionClient<typeof baseAuth>(),
    ],
})
