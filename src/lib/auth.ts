import { expo } from "@better-auth/expo";
import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import Stripe from "stripe";
import db from "@/db";
import * as schema from "@/db/schema";
import { routing } from "@/i18n/routing";

const plans = [
  {
    annualDiscountPrice: 1,
    annualDiscountPriceId: "",
    freeTrial: 1,
    name: "",
    price: 1,
    priceId: "",
  },
] as const;

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export const auth = betterAuth({
  experimental: {
    joins: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: {
      users: schema.usersTable,
      sessions: schema.sessionsTable,
      accounts: schema.accountsTable,
      verifications: schema.verificationsTable,
      subscriptions: schema.subscriptionsTable,
      sessionRelations: schema.sessionRelations,
      userRelations: schema.userRelations,
      accountRelations: schema.accountRelations,
    },
  }),
  trustedOrigins: [process.env.BETTER_AUTH_URL!],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, _request) => {
      console.log("sendResetPassword", user, url, token);
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      mapProfileToUser: (profile) => {
        return {
          firstname: profile.name.split(" ")[0],
          lastname: profile.name.split(" ")[1],
        };
      },
    },
    // google: {
    //     clientId: process.env.GOOGLE_CLIENT_ID!,
    //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //     mapProfileToUser: profile => {
    //         console.log('Google profile:', profile)
    //         return {
    //             firstname: profile.given_name,
    //             lastname: profile.family_name,
    //         }
    //     },
    // },
  },
  plugins: [
    nextCookies(),
    admin(),
    expo(),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      onEvent: async (event) => {
        console.log(`Stripe event received: ${event.type}`, { event });
      },
      subscription: {
        enabled: true,
        authorizeReference: async ({ user, session, referenceId, action }) => {
          console.log({ user, session, referenceId, action });
          return true;
        },
        plans: plans.map(
          ({ name, priceId, annualDiscountPriceId, freeTrial }) => ({
            name,
            priceId,
            annualDiscountPriceId,
            freeTrial: {
              days: freeTrial,
              onTrialStart: async (subscription) => {
                // Called when a trial starts
                console.log(
                  `Trial started for subscription ${subscription.id}`,
                  { subscription },
                );
              },
              onTrialEnd: async ({ subscription }, request) => {
                // Called when a trial ends
                console.log(`Trial ended for subscription ${subscription.id}`, {
                  subscription,
                  request,
                });
              },
              onTrialExpired: async (subscription) => {
                // Called when a trial expires without conversion
                console.log(
                  `Trial expired for subscription ${subscription.id}`,
                  { subscription },
                );
              },
            },
          }),
        ),
        onSubscriptionComplete: async ({
          event,
          subscription,
          stripeSubscription,
          plan,
        }) => {
          // Called when a subscription is successfully created
          console.log(
            `Subscription ${subscription.id} created for plan ${plan.name}`,
            {
              event,
              subscription,
              stripeSubscription,
              plan,
            },
          );
        },
        onSubscriptionUpdate: async ({ event, subscription }) => {
          // Called when a subscription is updated
          console.log(`Subscription ${subscription.id} updated`, {
            event,
            subscription,
          });
        },
        onSubscriptionCancel: async ({
          event,
          subscription,
          stripeSubscription,
          cancellationDetails,
        }) => {
          // Called when a subscription is canceled
          console.log(`subscription ${subscription.id} canceled`, {
            event,
            subscription,
            stripeSubscription,
            cancellationDetails,
          });
        },
        onSubscriptionDeleted: async ({
          event,
          subscription,
          stripeSubscription,
        }) => {
          // Called when a subscription is deleted
          console.log(`Subscription ${subscription.id} deleted`, {
            event,
            subscription,
            stripeSubscription,
          });
        },
      },
    }),
  ],
  user: {
    additionalFields: {
      firstname: {
        type: "string",
        required: true,
      },
      lastname: {
        type: "string",
        required: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      country: {
        type: "string",
        required: false,
        defaultValue: "BE",
      },
      locale: {
        type: "string",
        required: false,
        defaultValue: routing.defaultLocale,
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
      trustedProviders: ["google", "email-password"],
    },
  },
});

export type Session = typeof auth.$Infer.Session;
