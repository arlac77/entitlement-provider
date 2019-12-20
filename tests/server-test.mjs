import test from "ava";
import got from "got";
import { StandaloneServiceProvider } from "@kronos-integration/service";
//import { setup } from "../src/entitlement-provider.mjs";

let port = 3149;

test.before(async t => {
  port++;

  await setup(new StandaloneServiceProvider());

  t.context.port = port;

  const response = await got.post(`http://localhost:${port}/authenticate`, {
    json: {
      username: "user1",
      password: "secret"
    }
  });

  t.context.token = response.body.access_token;
});

test.after.always(async t => {
  // t.context.server.close();
});

test.skip("logs", async t => {
  const response = await got.get(`http://localhost:${t.context.port}/logs`, {
    headers: {
      Authorization: `Bearer ${t.context.token}`
    }
  });

  t.is(response.statusCode, 200);

  const json = JSON.parse(response.body);
  t.true(json.length >= 1);
  t.is(json[0].id, "job1");
});
