// Bots register with random names such as "31NKRUoY5l" or "YAtxOnDDEa".
// Real names usually have a space, or are plain words without digits or many inner capitals.
// The same rule exists in the database as public.looks_like_junk_name().
export function looksLikeJunkName(name) {
    const n = (name || "").trim();
    if (!n) return true;
    if (/\s/.test(n)) return false;
    if (!/^[A-Za-z0-9]{8,16}$/.test(n)) return false;
    if (/\d/.test(n)) return true;
    const innerUpper = (n.slice(1).match(/[A-Z]/g) || []).length;
    return innerUpper >= 3;
}
