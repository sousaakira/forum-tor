async function loadLayout(content) {
    try {
        // Carrega o template do layout
        const layoutResponse = await fetch('/components/layout.html');
        let layoutHtml = await layoutResponse.text();

        // Substitui o slot pelo conteúdo da página
        layoutHtml = layoutHtml.replace('<slot></slot>', content);

        // Atualiza o conteúdo da página
        document.documentElement.innerHTML = layoutHtml;

        // Recarrega os scripts necessários
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            document.head.appendChild(newScript);
        }
    } catch (error) {
        console.error('Erro ao carregar o layout:', error);
    }
} 