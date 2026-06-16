UPDATE "TariffPlan" SET "priceMonthly" = 1000 WHERE slug = 'start';

UPDATE "Payment"
SET status = 'canceled'
WHERE "yukassaId" = '31c35086-000f-5001-8000-1b0220062d9d';

UPDATE "Organization"
SET "subscriptionStatus" = 'none'
WHERE id = 'cmqgkcl6r0001o001xv345fnd';

SELECT u.email, o."subscriptionStatus", o.plan
FROM "User" u
JOIN "Organization" o ON u."organizationId" = o.id
WHERE u.email = 'letoceiling@gmail.com';

SELECT slug, "priceMonthly" FROM "TariffPlan" WHERE slug = 'start';
