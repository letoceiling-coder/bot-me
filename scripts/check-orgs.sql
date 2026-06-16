SELECT u.email, o.id, o."subscriptionStatus", o.plan
FROM "User" u
JOIN "Organization" o ON u."organizationId" = o.id
WHERE o.id IN ('cmqgkcl6r0001o001xv345fnd', 'cmqgjf5cn0000qn0tf1wp8ps5');

SELECT id, status, amount, "tariffSlug", "yukassaId", "organizationId"
FROM "Payment"
WHERE "organizationId" IN ('cmqgkcl6r0001o001xv345fnd', 'cmqgjf5cn0000qn0tf1wp8ps5');
