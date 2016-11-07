
function isHandler(genericRequest) {
  return genericRequest.noAction;
}

function processRequest(genericRequest) {
  return { context: genericRequest.context };
}

module.exports = {
  isHandler: isHandler
};

// return {
//   isHandler: isHandler
// };
