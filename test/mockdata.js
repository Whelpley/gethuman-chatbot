/*
CHECKLIST
_ Mock Companies API return (C&P from actual results)
_ Mock Posts API return (C&P from actual results)

*/

'use strict'

// ex structure
function getArrayOfStrings() {
  return ['check', 'it', 'out'];
}

// // returns a pared-down Company object, with Posts and Other Companies attached
// function getGenericResponse(context) {
//   return {
//     userInput: context.userInput,
//     data: {
//       name: '',
//       contactMethods: {
//         phone: '',
//         email: '',
//         twitter: '',
//         web: '',
//         chat: '',
//         facebook: ''
//       },
//       posts: [{
//         title: post.title || '',
//         urlId: post.urlId || '',
//       },
//       {
//         title: post.title || '',
//         urlId: post.urlId || '',
//       },
//       {
//         title: post.title || '',
//         urlId: post.urlId || '',
//       },
//       {
//         title: post.title || '',
//         urlId: post.urlId || '',
//       },
//       {
//         title: post.title || '',
//         urlId: post.urlId || '',
//       }],
//       otherCompanies: ['', '', '', '', '']
//     },
//     type: '',
//     context: context
//   }
// }

module.exports = {
  getArrayOfStrings: getArrayOfStrings
}
