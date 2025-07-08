import { fetchAPI } from '@/lib/fetch'
import { StartSSOFlowParams, StartSSOFlowReturnType } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'

export const googleOAuth = async (
    startSSOFlow: (
        options: StartSSOFlowParams
    ) => Promise<StartSSOFlowReturnType>
) => {
    try {
        console.log('đã tới hàm googleOAuth')
        const { createdSessionId, signUp, setActive } = await startSSOFlow({
            strategy: 'oauth_google',
            redirectUrl: Linking.createURL('/(root)/(tabs)/home'),
        })
        if (createdSessionId) {
            console.log(createdSessionId)
            if (setActive) {
                await setActive({ session: createdSessionId })

                if (signUp?.createdUserId) {
                    await fetchAPI('/(api)/user', {
                        method: 'POST',
                        body: JSON.stringify({
                            name: `${signUp?.firstName} ${signUp?.lastName}`,
                            email: signUp.emailAddress,
                            clerkId: signUp.createdUserId,
                        }),
                    })
                }

                return {
                    success: true,
                    code: 'success',
                    message: 'You have successfully signed in with Google',
                }
            }
        }

        return {
            success: false,
            message: 'An error occurred while signing in with Google',
        }
    } catch (error: any) {
        console.log(error)
        return {
            success: false,
            code: error.code,
            message: error?.errors[0]?.longMessage,
        }
    }
}
