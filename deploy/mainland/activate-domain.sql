-- Apply only AFTER DNS, HTTPS, same-origin API and complete flow pass live checks.
-- Does not create, delete, reset or regenerate any Token, result or Session.
begin;
insert into dna_private.settings(key,value) values
 ('access_base_url','"https://dna.avenchao.top/"'::jsonb),
 ('access_link_style','"path"'::jsonb)
on conflict(key) do update set value=excluded.value;
commit;
