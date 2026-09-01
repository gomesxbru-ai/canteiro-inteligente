REVOKE ALL ON FUNCTION public.is_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_company_role(UUID, UUID, public.company_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.shares_company(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_role(UUID, UUID, public.company_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_company(UUID, UUID) TO authenticated;