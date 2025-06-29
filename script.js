document.addEventListener('DOMContentLoaded', () => {
    // --- Verificação de Autenticação ---
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }

    const currentUsernameSpan = document.getElementById('current-username');
    if (currentUsernameSpan) {
        currentUsernameSpan.textContent = currentUser.username;
    }

    // --- Logout ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('currentUser');
                window.location.href = 'auth.html';
            }
        });
    }

    // --- Elementos do Dashboard e Transações ---
    const formTransacao = document.getElementById('form-transacao');
    const descricaoInput = document.getElementById('descricao');
    const valorInput = document.getElementById('valor');
    const tipoInput = document.getElementById('tipo');
    const categoriaGroup = document.getElementById('categoria-group');
    const categoriaInput = document.getElementById('categoria');
    const parcelamentoCampos = document.getElementById('parcelamento-campos');
    const parcelasInput = document.getElementById('parcelas');
    const saldoSpan = document.getElementById('saldo');
    const receitasTotaisSpan = document.getElementById('receitas-totais');
    const despesasTotaisSpan = document.getElementById('despesas-totais');
    const transacoesBody = document.getElementById('transacoes-body');
    const financialChartCtx = document.getElementById('financialChart').getContext('2d');

    let transacoes = JSON.parse(localStorage.getItem(`transacoes_${currentUser.username}`)) || [];
    let financialChart;

    // --- Elementos e Dados de Investimentos ---
    const formInvestimento = document.getElementById('form-investimento');
    const investDescricaoInput = document.getElementById('invest-descricao');
    const investValorInput = document.getElementById('invest-valor');
    const investDataInput = document.getElementById('invest-data');
    const totalInvestidoSpan = document.getElementById('total-investido');
    const investimentosBody = document.getElementById('investimentos-body');

    let investimentos = JSON.parse(localStorage.getItem(`investimentos_${currentUser.username}`)) || [];

    // --- Funções de Utilitário ---
    function formatCurrency(value) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }

    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // --- Função para Renderizar Transações ---
    function renderTransacoes() {
        transacoesBody.innerHTML = '';
        let saldo = 0;
        let receitasTotais = 0;
        let despesasTotais = 0;

        transacoes.forEach(transacao => {
            const row = transacoesBody.insertRow();
            row.classList.add(transacao.tipo === 'receita' ? 'type-receita' : 'type-despesa');

            row.insertCell().textContent = transacao.descricao;
            row.insertCell().textContent = formatCurrency(transacao.valor);
            row.insertCell().textContent = transacao.tipo === 'receita' ? 'Receita' : 'Despesa';
            row.insertCell().textContent = transacao.categoria || 'N/A';
            row.insertCell().textContent = new Date(transacao.data).toLocaleDateString('pt-BR');
            row.insertCell().textContent = transacao.parcelas && transacao.parcelas > 1
                ? `${transacao.parcelaAtual}/${transacao.parcelas}`
                : 'N/A';

            const acoesCell = row.insertCell();
            acoesCell.classList.add('action-buttons');

            const btnEditar = document.createElement('button');
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.title = 'Editar';
            btnEditar.onclick = () => editarTransacao(transacao.id);
            acoesCell.appendChild(btnEditar);

            const btnExcluir = document.createElement('button');
            btnExcluir.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnExcluir.title = 'Excluir';
            btnExcluir.classList.add('btn-delete');
            btnExcluir.onclick = () => excluirTransacao(transacao.id);
            acoesCell.appendChild(btnExcluir);

            if (transacao.tipo === 'receita') {
                saldo += transacao.valor;
                receitasTotais += transacao.valor;
            } else {
                saldo -= transacao.valor;
                despesasTotais += transacao.valor;
            }
        });

        saldoSpan.textContent = formatCurrency(saldo);
        receitasTotaisSpan.textContent = formatCurrency(receitasTotais);
        despesasTotaisSpan.textContent = formatCurrency(despesasTotais);

        localStorage.setItem(`transacoes_${currentUser.username}`, JSON.stringify(transacoes));
        updateChart(receitasTotais, despesasTotais);
        renderInvestimentos(); // Chamar renderInvestimentos aqui para atualizar o total investido no dashboard
    }

    // Lógica para mostrar/ocultar campos de categoria e parcelamento
    tipoInput.addEventListener('change', () => {
        if (tipoInput.value === 'despesa') {
            categoriaGroup.style.display = 'block';
            parcelamentoCampos.style.display = 'block';
            categoriaInput.required = true;
            parcelasInput.required = true;
        } else {
            categoriaGroup.style.display = 'none';
            parcelamentoCampos.style.display = 'none';
            categoriaInput.required = false;
            parcelasInput.required = false;
            parcelasInput.value = 1;
            categoriaInput.value = '';
        }
    });

    // Função para adicionar uma nova transação
    formTransacao.addEventListener('submit', (event) => {
        event.preventDefault();

        const descricao = descricaoInput.value.trim();
        const valor = parseFloat(valorInput.value);
        const tipo = tipoInput.value;
        const categoria = categoriaInput.value.trim();
        const data = new Date().toISOString();
        const parcelas = parseInt(parcelasInput.value);

        if (!descricao || isNaN(valor) || valor <= 0) {
            alert('Por favor, preencha a descrição e um valor válido.');
            return;
        }

        if (tipo === 'despesa' && parcelas > 1) {
            const valorParcela = valor / parcelas;
            for (let i = 1; i <= parcelas; i++) {
                transacoes.push({
                    id: generateUniqueId(),
                    descricao: `${descricao} (Parc. ${i}/${parcelas})`,
                    valor: valorParcela,
                    tipo: tipo,
                    categoria: categoria,
                    data: data,
                    parcelas: parcelas,
                    parcelaAtual: i
                });
            }
        } else {
            transacoes.push({
                id: generateUniqueId(),
                descricao,
                valor,
                tipo,
                categoria: tipo === 'despesa' ? categoria : '',
                data,
                parcelas: 1,
                parcelaAtual: 1
            });
        }

        formTransacao.reset();
        categoriaGroup.style.display = 'none';
        parcelamentoCampos.style.display = 'none';
        parcelasInput.value = 1;
        renderTransacoes();
    });

    // Função para excluir uma transação
    function excluirTransacao(id) {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            transacoes = transacoes.filter(transacao => transacao.id !== id);
            renderTransacoes();
        }
    }

    // Função para editar uma transação (Placeholder)
    function editarTransacao(id) {
        alert('Funcionalidade de edição ainda não implementada para transações. ID: ' + id);
    }

    // Lógica do Chart.js
    function updateChart(receitas, despesas) {
        if (financialChart) {
            financialChart.destroy();
        }

        financialChart = new Chart(financialChartCtx, {
            type: 'doughnut',
            data: {
                labels: ['Receitas', 'Despesas'],
                datasets: [{
                    data: [receitas, despesas],
                    backgroundColor: [
                        '#2ecc71',
                        '#e74c3c'
                    ],
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14,
                                family: 'Poppins'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += formatCurrency(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- Função para Renderizar Investimentos ---
    function renderInvestimentos() {
        investimentosBody.innerHTML = '';
        let totalInvestido = 0;

        investimentos.forEach(investimento => {
            const row = investimentosBody.insertRow();
            row.insertCell().textContent = investimento.descricao;
            row.insertCell().textContent = formatCurrency(investimento.valor);
            row.insertCell().textContent = new Date(investimento.data).toLocaleDateString('pt-BR');

            const acoesCell = row.insertCell();
            acoesCell.classList.add('action-buttons');

            const btnEditar = document.createElement('button');
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.title = 'Editar';
            btnEditar.onclick = () => editarInvestimento(investimento.id);
            acoesCell.appendChild(btnEditar);

            const btnExcluir = document.createElement('button');
            btnExcluir.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnExcluir.title = 'Excluir';
            btnExcluir.classList.add('btn-delete');
            btnExcluir.onclick = () => excluirInvestimento(investimento.id);
            acoesCell.appendChild(btnExcluir);

            totalInvestido += investimento.valor;
        });

        totalInvestidoSpan.textContent = formatCurrency(totalInvestido);
        localStorage.setItem(`investimentos_${currentUser.username}`, JSON.stringify(investimentos));
    }

    // --- Lógica para Adicionar Investimento ---
    formInvestimento.addEventListener('submit', (event) => {
        event.preventDefault();

        const descricao = investDescricaoInput.value.trim();
        const valor = parseFloat(investValorInput.value);
        const data = investDataInput.value;

        if (!descricao || isNaN(valor) || valor <= 0 || !data) {
            alert('Por favor, preencha todos os campos do investimento com valores válidos.');
            return;
        }

        investimentos.push({
            id: generateUniqueId(),
            descricao,
            valor,
            data: new Date(data + 'T12:00:00').toISOString() // Adiciona 'T12:00:00' para evitar problemas de fuso horário
        });

        formInvestimento.reset();
        renderInvestimentos();
    });

    // --- Função para Excluir Investimento ---
    function excluirInvestimento(id) {
        if (confirm('Tem certeza que deseja excluir este investimento?')) {
            investimentos = investimentos.filter(investimento => investimento.id !== id);
            renderInvestimentos();
        }
    }

    // --- Função para Editar Investimento (Placeholder) ---
    function editarInvestimento(id) {
        alert('Funcionalidade de edição ainda não implementada para investimentos. ID: ' + id);
    }


    // --- Navegação da Sidebar ---
    const sidebarLinks = document.querySelectorAll('.sidebar nav ul li a');
    const sections = document.querySelectorAll('.main-content section');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id === 'logout-btn') {
                return;
            }

            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            sidebarLinks.forEach(l => l.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');

            sections.forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById(targetId).style.display = 'block';

            if (targetId === 'dashboard' && financialChart) {
                financialChart.resize(); // Redesenha o gráfico se voltar para o dashboard
            }
            // Renderiza investimentos se for para a seção de investimentos
            if (targetId === 'investimentos') {
                renderInvestimentos();
            }
        });
    });

    // Garante que o dashboard é a seção inicial visível
    document.getElementById('transacoes').style.display = 'none';
    document.getElementById('investimentos').style.display = 'none';
    document.getElementById('relatorios').style.display = 'none';
    document.getElementById('configuracoes').style.display = 'none';

    // Renderiza as transações e investimentos iniciais ao carregar a página
    renderTransacoes(); // Isso já vai chamar renderInvestimentos()
});