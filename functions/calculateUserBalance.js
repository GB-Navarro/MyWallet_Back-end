export default function calculateUserBalance(userEntries){
    let userBalances = [];
    let userBalance = 0;
    userEntries.forEach((entry) => {
      delete entry.description
      delete entry.date
      userBalances.push(entry);
    });
    userBalances.forEach((element) => {
      if(element.type === "entry"){
        userBalance += parseInt(element.value);
      }else if(element.type === "exit"){
        userBalance -= parseInt(element.value);
      }
    })
    return userBalance;
  }