export default function filterUserEntries(userEntries) {
    let filteredUserEntries = [];
    userEntries.forEach((entry) => {
      delete entry._id;
      delete entry.email;
      filteredUserEntries.push(entry);
    })
    return filteredUserEntries;
  }