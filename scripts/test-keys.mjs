#!/usr/bin/env node
(async () => {
  const login = await fetch("http://127.0.0.1:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "dsc-23@yandex.ru", password: "123123123" }),
  });
  const { token } = await login.json();
  const test = await fetch("http://127.0.0.1:3001/api/admin/settings/test", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
  });
  console.log(JSON.stringify(await test.json(), null, 2));
})();
