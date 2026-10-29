# Reading the GoHighLevel API docs from this repo

`marketplace.gohighlevel.com` is blocked by our network egress proxy, so the
browsable docs cannot be fetched from a sandboxed session. That is a network
rule, not a missing permission, and it is not going to change from our side.

**`registry.npmjs.org` is reachable**, and HighLevel publishes an official SDK
generated from their own OpenAPI spec. That package is the whole API surface —
every resource, every method, every request and response type — and it is the
way to read the docs without leaving the sandbox.

```sh
cd /tmp
npm pack @gohighlevel/api-client        # currently 3.0.0
tar xzf gohighlevel-api-client-*.tgz

# every resource:
ls package/dist/lib/code

# a resource's methods:
cat package/dist/lib/code/contacts/contacts.d.ts

# its request/response shapes:
cat package/dist/lib/code/contacts/models/contacts.d.ts
```

## What is checked in here

| File | What it is |
|---|---|
| `api-v3-index.md` | Every resource and every method name, generated from the SDK |
| `models-contacts.d.ts` | Contact request/response types, including `FollowersDTO` |
| `models-conversations.d.ts` | Message, thread, recording and transcription types |
| `models-opportunities.d.ts` | Opportunity, pipeline and stage types |
| `models-calendars.d.ts` | Calendar, appointment, slot and schedule types |
| `models-users.d.ts` | User types, for resolving owner ids to people |

These are copied verbatim from the SDK so they can be grepped without a network
call. Refresh them by re-running the commands above when the SDK version moves.

## The rules that matter

- Base URL `https://services.leadconnectorhq.com`, unchanged from v2.
- Header `Version: v3`. HighLevel replaced date-based versions with named ones;
  their current docs mark the header required with `v3` the accepted value.
  We still send `2021-07-28` on most calls — see `_shared/ghlClient.ts`.
- Auth is a bearer token, **Sub-Account** type — OAuth access token or Private
  Integration Token.
- **Migrate one endpoint at a time.** The version header is per-request and each
  resource has its own response DTO, so `ghlFetch` takes a per-call `version`
  and `GHL_VERSION` stays the default. Flipping the default would move all 33
  edge functions at once with no way to tell which one broke.

## When the SDK is not enough

The SDK gives shapes, not prose — it will not tell you rate limits, scope names
or behavioural caveats. For those, the docs page has to be read by a human and
pasted in. Ask for the specific page rather than guessing.
