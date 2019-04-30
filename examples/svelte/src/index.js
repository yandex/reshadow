import App from './App.svelte';

const app = new App({
    target: document.body,
    props: {
        name: 'world',
        styles: {
            __p: 'hey',
        },
    },
});

window.app = app;

export default app;
