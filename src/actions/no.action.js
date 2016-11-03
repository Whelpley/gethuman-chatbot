
function isHandler(genericRequest) {
  return genericRequest.noAction;
}

function processRequest(genericRequest) {
  return { context: genericRequest.context };
}

return {
  isHandler: isHandler
};
