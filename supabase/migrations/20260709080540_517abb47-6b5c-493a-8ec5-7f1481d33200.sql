-- Scope the admin realtime policy to admin-prefixed topics so that, if private
-- Broadcast/Presence channels are introduced, an admin can only subscribe to
-- topics intended for admin features (topic name starting with 'admin:'),
-- rather than any arbitrary topic.
DROP POLICY IF EXISTS "Admins can use realtime" ON realtime.messages;

CREATE POLICY "Admins can use realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  AND (
    realtime.topic() IS NULL
    OR realtime.topic() LIKE 'admin:%'
  )
);