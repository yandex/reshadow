module.exports = ['__use--content'].reduce((acc, v) => ({...acc, [v]: v}), {});

module.exports.elements = JSON.stringify({
    'use--content': {mods: {}, props: {}},
});
