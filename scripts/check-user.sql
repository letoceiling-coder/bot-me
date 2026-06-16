SELECT u.email, o.id AS org_id, o.plan, o."subscriptionStatus", o."subscriptionExpiresAt"
FROM "User" u
JOIN "Organization" o ON u."organizationId" = o.id
WHERE u.email = 'letoceiling@gmail.com';

SELECT id, status, "tariffSlug", "yukassaId", "createdAt"
FROM "Payment"
WHERE "organizationId" IN (
  SELECT "organizationId" FROM "User" WHERE email = 'letoceiling@gmail.com'
)
ORDER BY "createdAt" DESC;
