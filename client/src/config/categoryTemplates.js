const categoryTemplates = {
  watch: {
    front: `
// Front-end watch template
`
  }
};

const template = categoryTemplates.watch.front;
const finalPrompt = template + userAdjustments;

module.exports = categoryTemplates;
