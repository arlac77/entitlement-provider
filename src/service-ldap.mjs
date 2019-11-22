import ldapts from "ldapts";

import { Service } from "@kronos-integration/service";

export class ServiceLDAP extends Service {
    static get endpoints() {
        return {
            ...super.endpoints,
            authenticate: {
                default: true,
                receive: "authenticate"
            }
        };
    }

    /**
     * authorize user / password
     * @param {string} username
     * @param {string} password
     * @return {Set<string>} entitlements
     */
    async authenticate(username, password) {
        const auth = config.auth;

        const entitlements = new Set();

        const ldap = auth.ldap;
        if (ldap !== undefined) {
            const client = new ldapts.Client({
                url: ldap.url
            });

            const values = {
                username
            };

            function expand(str) {
                return str.replace(/\{\{(\w+)\}\}/, (match, g1) => values[g1] ? values[g1] : g1);
            }

            try {
                await client.bind(expand(ldap.bindDN), password);

                const { searchEntries } = await client.search(
                    expand(ldap.entitlements.base),
                    {
                        scope: ldap.entitlements.scope,
                        filter: expand(ldap.entitlements.filter),
                        attributes: [ldap.entitlements.attribute]
                    }
                );
                searchEntries.forEach(e => {
                    const entitlement = e[ldap.entitlements.attribute];
                    entitlements.add(entitlement);
                });
            } finally {
                await client.unbind();
            }
        }

        if (auth.users !== undefined) {
            const user = auth.users[username];
            if (user !== undefined) {
                if (user.password === password) {
                    user.entitlements.forEach(e => entitlements.add(e));
                }
                else {
                    throw new Error("Wrong credentials");
                }
            }
        }

        return { entitlements };
    }
}
