-- Restore delivery URL presentation only. All usage and sessions remain intact.
begin;
insert into dna_private.settings(key,value) values
 ('access_base_url','"https://avenchao.github.io/design-dna/"'::jsonb),
 ('access_link_style','"query"'::jsonb)
on conflict(key) do update set value=excluded.value;
commit;
