import { getSeo } from 'remix-seo';

const seo = getSeo({
  // set defaults that will apply to routes w/o specific SEO tags
  title: 'Snkrs',
  titleTemplate: '%s | Snkrs',
  openGraph: {
    type: 'website',
    locale: 'en_US',
  },
});

export { seo };
