FUNCTION Check_Error__ RETURN BOOLEAN IS
BEGIN
    :error := g_error_message;
    RETURN g_error_message IS NOT NULL;
END Check_Error__;