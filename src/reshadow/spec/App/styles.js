module.exports = [
    '__button',
    '__use--control',
    '_disabled',
    '_type_submit',
    '_use--theme_normal',
].reduce((acc, v) => ({...acc, [v]: v}), {});

module.exports.elements = JSON.stringify({
    button: {
        mods: {theme: ['normal']},
        props: {disabled: [''], type: ['submit']},
    },
    control: {mods: {}, props: {}},
});
