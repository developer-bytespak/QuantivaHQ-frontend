/**
 * Country list helper — fetches once from restcountries.com and caches the
 * result for the lifetime of the tab. Same source the onboarding personal-info
 * page uses, but trimmed to just `{ code, name }` since the affiliate form
 * doesn't need dial codes or regions.
 */

export interface CountryOption {
  code: string;
  name: string;
}

let cache: CountryOption[] | null = null;
let inFlight: Promise<CountryOption[]> | null = null;

export async function getCountries(): Promise<CountryOption[]> {
  if (cache) return cache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const response = await fetch(
        "https://restcountries.com/v3.1/all?fields=cca2,name",
      );
      if (!response.ok) {
        throw new Error(`Country API error: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid country API response");
      }
      const list = data
        .map((c: { cca2?: string; name?: { common?: string } }) => ({
          code: c.cca2 ?? "",
          name: c.name?.common ?? "",
        }))
        .filter((c: CountryOption) => c.code && c.name)
        .sort((a: CountryOption, b: CountryOption) =>
          a.name.localeCompare(b.name),
        );
      cache = list;
      return list;
    } catch (err) {
      // On failure, fall back to a tiny hardcoded list so the form still works
      // (better than blocking signup behind a flaky external API).
      console.warn("getCountries: falling back to short list", err);
      const fallback: CountryOption[] = [
        { code: "US", name: "United States" },
        { code: "GB", name: "United Kingdom" },
        { code: "CA", name: "Canada" },
        { code: "AU", name: "Australia" },
        { code: "DE", name: "Germany" },
        { code: "FR", name: "France" },
        { code: "IN", name: "India" },
        { code: "JP", name: "Japan" },
        { code: "SG", name: "Singapore" },
        { code: "BR", name: "Brazil" },
        { code: "MX", name: "Mexico" },
      ];
      cache = fallback;
      return fallback;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
