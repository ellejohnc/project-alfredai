-- Take the emailless Alpha leads out of the enrichment queue, and keep them.
--
-- Applied through Lovable on 8 Sep and verified before this file was written:
-- 2,736 excluded, 1,030 still candidates, 0 emailless rows left queued.
--
-- WHY A COLUMN RATHER THAN A DELETE. The instruction was "drop the ones with no
-- email", and that reads two ways — out of the queue, or out of the database.
-- It is the first. These are LinkedIn outbound prospects and the profile URL IS
-- the channel, so the records are worth keeping; what is being dropped is the
-- pretence that they are waiting to be enriched.
--
-- WHY IT IS RECORDED AT ALL, given they already could not be pushed:
-- require_email defaults TRUE, so nothing was going to send them anyway. The
-- difference is that a filter is an accident and a column is a decision. Without
-- this, the same 2,736 rows get re-counted as a backlog every time somebody new
-- looks at the number, which is exactly what happened twice already.
--
-- Reversible by design: clearing enrichment_excluded_at puts a lead back in the
-- queue, and the reason it left is written beside it.

alter table alpha_digital_leads
  add column if not exists enrichment_excluded_at timestamptz,
  add column if not exists enrichment_excluded_reason text;

comment on column alpha_digital_leads.enrichment_excluded_at is
  'Set when a lead was deliberately taken OUT of the enrichment queue. The record is kept in full - this marks a decision, not a deletion, so nobody re-queues it later wondering why it keeps failing. Null means still a candidate.';

update alpha_digital_leads
set enrichment_excluded_at = now(),
    enrichment_excluded_reason = 'No email address. Decision 8 Sep: keep the record, stop treating it as an enrichment candidate. LinkedIn remains the channel for these.',
    updated_at = now()
where archived_at is null
  and coalesce(nullif(trim(email), ''), null) is null
  and enrichment_excluded_at is null;
