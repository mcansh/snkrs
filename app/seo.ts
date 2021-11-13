import { initSeo } from 'remix-seo';

const { getSeo, getSeoLinks, getSeoMeta } = initSeo({
  // set defaults that will apply to routes w/o specific SEO tags
  title: 'Snkrs',
  titleTemplate: '%s | Snkrs',
  openGraph: {
    type: 'website',
    locale: 'en_US',
  },
});

export { getSeo, getSeoLinks, getSeoMeta };
