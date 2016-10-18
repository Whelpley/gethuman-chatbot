'use strict'

function preResponse(context) {
  // shoot back an immediate Status 200 to let client know it's all cool
  // (much pain if neglected)
  if (!context.isTest) {
    context.finishResponse();
  }
}

module.exports = {
  preResponse: preResponse,
}
