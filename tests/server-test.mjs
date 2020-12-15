import test from "ava";
import got from "got";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import initialize from "../src/initialize.mjs";

let port = 3149;

test.before(async t => {
  port++;

  t.context.sp = new StandaloneServiceProvider();
  t.context.port = port;

  await initialize(t.context.sp);

  try {
    const response = await got.post(`http://localhost:${port}/authenticate`, {
      json: {
        username: "user1",
        password: "secret"
      }
    });

    t.context.token = response.body.access_token;
  } catch (x) {}
});

test.after.always(async t => {
  // t.context.server.close();
});

test("startup", async t => {
  t.is(t.context.sp.state, "running");
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
