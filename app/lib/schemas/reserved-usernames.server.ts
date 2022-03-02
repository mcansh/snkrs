import reservedEmailAddressesList from 'reserved-email-addresses-list/index.json';
import reservedAdminList from 'reserved-email-addresses-list/admin-list.json';

let reservedUsernames = [
  ...reservedEmailAddressesList,
  ...reservedAdminList,
  'healthcheck',
];

export { reservedUsernames };
