<script>
    import styled, {css} from 'reshadow';

    import * as themes from './themes';

    export let name = '';
    export let theme = 'light';

    let count = 0;
    let color = randomColor();

    function randomColor() {
        const colors = [
            'purple',
            'red',
            'green',
            'darkorange',
            'rebeccapurple',
            'pink',
            'orange',
            'blue',
        ];

        return colors[Math.floor(Math.random() * colors.length)];
    }

    styled(themes[theme])`
        container {
            display: flex;
            flex-direction: column;
            padding: 10px;
            align-items: center;

            & button + button {
                margin-top: 10px;
            }
        }

        button {
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 16px;
        }

        h1 {
            color: ${color};
        }
    `;
</script>

<container>
    <h1>hello {name}</h1>

    <button
        on:click={() => {
            color = randomColor();
        }}>
        Random Title color
    </button>

    <button
        on:click={() => {
            theme = 'light';
        }}>
        Light Theme
    </button>

    <button
        on:click={() => {
            theme = 'dark';
        }}>
        Dark Theme
    </button>

    <button
        on:click={() => {
            count++;
        }}>
        Increment ({count})
    </button>

    {#if count > 0}
        <p>counting down... {count}</p>
    {:else}
        <p>lift-off!</p>
    {/if}
</container>
