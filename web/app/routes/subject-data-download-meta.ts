export function meta() {
  return [
    { title: 'Subject Data Download' },
    {
      name: 'description',
      content:
        'Download all contact data stored about you in vCard format. Exercise your right to data portability and keep a copy of your personal information.',
    },
    {
      name: 'keywords',
      content:
        'Subject Data Download, data portability, GDPR, personal information, vCard export, contact data download, privacy',
    },
    { property: 'og:title', content: 'Subject Data Download' },
    {
      property: 'og:description',
      content: 'Download your personal information in a portable, machine-readable format.',
    },
    { property: 'og:type', content: 'website' },
  ];
}

export const handle = {
  subtitleKey: 'navigation.subtitles.dataDownload',
};
