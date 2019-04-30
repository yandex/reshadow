<script>
    import styled from 'reshadow';

    export let name;
    export let styles;
    export let disabled = true;
    export let count = 0;
    export let size = 'm';
    export let color = 'red';

    styled(styles)`
        p {
            color: ${color};
        }

        button[|size='m'] {
            font-size: 20px;
        }

        button[|variant='action'] {
            background-color: purple;
        }

        button[disabled] {
            color: grey;
        }
    `;
</script>

<container>
    <p>hello {name}</p>

    <p>color: {color}</p>

    <button {size} on:click={() => count++} type=button :variant=action :size=m>
        click me 2
    </button>

    <button {disabled}>disabled</button>

    <button on:click={() => color = 'green'}>green</button>
    <button on:click={() => color = 'red'}>red</button>
</container>

{#if count > 0}
	<p>counting down... {count}</p>
{:else}
	<p>lift-off!</p>
{/if}
