# PassportPalsv2

A D3.js choropleth world map that combines the visa requirements of two
passports (currently USA + South Africa) and colours each destination by the
*worst* of the two requirements — i.e. where could you both travel together
most easily.

## Running locally

The page fetches the CSV and GeoJSON files, so it needs to be served over
HTTP rather than opened as a `file://` URL:

```sh
npx serve .
# or: python -m http.server
```

Then open the printed localhost URL.

## Data

Visa requirement data comes from
[imorte/passport-index-data](https://github.com/imorte/passport-index-data),
a maintained fork of
[ilyankou/passport-index-dataset](https://github.com/ilyankou/passport-index-dataset)
(both scraped from the [Passport Index](https://www.passportindex.org/)).

The data is refreshed automatically: a scheduled GitHub Actions workflow
([`.github/workflows/update-data.yml`](.github/workflows/update-data.yml))
runs every Monday, downloads the latest `passport-index-tidy-iso3.csv`, and
commits it if anything changed, along with the last-updated date in
[`data-meta.json`](data-meta.json) which is shown in the page footer. It can
also be triggered manually from the repo's Actions tab ("Update visa data" →
"Run workflow").

Country boundaries come from `countries-land-10km.geo.json`
([simonepri/geo-maps](https://github.com/simonepri/geo-maps)).
