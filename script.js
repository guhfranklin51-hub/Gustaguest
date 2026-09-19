const campoPergunta = document.querySelector(".caixa-pergunta input");
const botaoEnviar = document.querySelector(".botao-enviar")
const telaInicial = document.querySelector(".tela-inicial");
const telaChat = document.querySelector(".tela-chat");
const botaoNovaConversa = document.querySelector(".nova-conversa");
const historicoChats = document.querySelector(".historico-chats");
const areaMensagens = document.querySelector(".mensagens-chat");
const rolagemChat = document.querySelector(".rolagem-chat");
const campoChat = document.querySelector(".caixa-chat textarea");
const botaoChatEnviar = document.querySelector(".botao-chat-enviar");
const inputFotoPerfil = document.querySelector("#foto-perfil");
const usuarioAvatarFoto = document.querySelector(".usuario-avatar-foto");
const usuarioAvatarLetra = document.querySelector(".usuario-avatar-letra");
const usuarioAvatar = document.querySelector(".usuario-avatar");
const modalFotoPerfil = document.querySelector(".modal-foto-perfil");
const modalFotoImagem = document.querySelector(".modal-foto-imagem");
const fecharModalFoto = document.querySelector(".fechar-modal-foto");
const trocarFotoPerfil = document.querySelector(".trocar-foto-perfil");
const fotoPerfilSalva = localStorage.getItem("fotoPerfil");
const usuarioNome = document.querySelector(".usuario-nome");
const usuarioNomeInput = document.querySelector(".usuario-nome-input");

let AZURE_API_URL = "";
let AZURE_API_KEY = "";
let AZURE_MODEL = "";

async function carregarConfiguracoes() {
    const resposta = await fetch("./config.env");

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar o config.env");
    }

    const texto = await resposta.text();

    const configuracoes = Object.fromEntries(
        texto
            .split("\n")
            .map((linha) => linha.trim())
            .filter((linha) => linha && !linha.startsWith("#"))
            .map((linha) => {
                const posicaoIgual = linha.indexOf("=");

                return [
                    linha.slice(0, posicaoIgual).trim(),
                    linha.slice(posicaoIgual + 1).trim()
                ];
            })
    );

    AZURE_API_URL = configuracoes.AZURE_API_URL;
    AZURE_API_KEY = configuracoes.AZURE_API_KEY;
    AZURE_MODEL = configuracoes.AZURE_MODEL;
}

const configuracoesProntas = carregarConfiguracoes();

const instrucoesGustaguest = `
Você é o Gustaguest, um assistente de inteligência artificial especializado em
estudos, aprendizagem e apoio educacional.

Atue sempre como um tutor paciente, claro, adaptável e didático. Seu objetivo
principal não é apenas responder corretamente, mas ajudar o usuário a entender.
Adapte automaticamente a explicação ao conhecimento demonstrado pelo usuário.

Para iniciantes, use linguagem simples, explique termos técnicos, divida assuntos
complexos em etapas, dê exemplos concretos e explique o motivo das etapas.
Para usuários intermediários, seja mais direto sem retirar explicações necessárias.
Para usuários avançados, aceite linguagem técnica e aprofunde quando for útil.

Em exercícios, explique o raciocínio e não forneça somente a resposta quando a
explicação for importante. Se o usuário não entender, simplifique e tente outra
abordagem. Responda perguntas simples de maneira natural e curta.

Use português brasileiro, salvo quando o usuário pedir outro idioma. Em fórmulas,
prefira símbolos simples e legíveis no texto, como π, vezes, dividido por, √, ² e ³.
`;

function montarHistoricoAzure(historico) {
    return historico.map(function (item) {
        return {
            role: item.autor === "ia" ? "assistant" : "user",
            content: item.texto
        };
    });
}

async function consultarAzure(mensagem, historico, instrucaoSistema) {
    await configuracoesProntas;

    const resposta = await fetch(AZURE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + AZURE_API_KEY
        },
        body: JSON.stringify({
            model: AZURE_MODEL,
            messages: [
                {
                    role: "system",
                    content: instrucaoSistema || instrucoesGustaguest
                },
                ...montarHistoricoAzure(historico || []),
                {
                    role: "user",
                    content: mensagem
                }
            ],
            max_completion_tokens: 4096,
            reasoning_effort: "low"
        })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        const detalhe =
            dados.error && dados.error.message
                ? dados.error.message
                : "Erro ao consultar a Azure.";

        throw new Error(detalhe);
    }

    const texto =
        dados.choices?.[0]?.message?.content?.trim() || "";

    if (texto === "") {
        throw new Error("A Azure não devolveu uma resposta.");
    }

    return texto;
}   
campoChat.addEventListener("input", function () {
    campoChat.style.height = "auto";

    const alturaMaxima = 150;

    if (campoChat.scrollHeight <= alturaMaxima) {
        campoChat.style.height = campoChat.scrollHeight + "px";
        campoChat.style.overflowY = "hidden";
    } else {
        campoChat.style.height = alturaMaxima + "px";
        campoChat.style.overflowY = "auto";
    }
});

const nomeUsuarioSalvo = localStorage.getItem("nomeUsuario");

if (nomeUsuarioSalvo) {
    usuarioNome.textContent = nomeUsuarioSalvo;
}

usuarioNome.addEventListener("click", function () {
    usuarioNomeInput.value = usuarioNome.textContent;

    usuarioNome.hidden = true;
    usuarioNomeInput.hidden = false;

    usuarioNomeInput.focus();
});

usuarioNomeInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        const novoNome = usuarioNomeInput.value.trim();

        if (novoNome !== "") {
            usuarioNome.textContent = novoNome;
            localStorage.setItem("nomeUsuario", novoNome);
        }

        usuarioNomeInput.hidden = true;
        usuarioNome.hidden = false;
    }
});

if (fotoPerfilSalva) {
    usuarioAvatarFoto.src = fotoPerfilSalva;
    usuarioAvatarFoto.style.display = "block";
    usuarioAvatarLetra.style.display = "none";
}

usuarioAvatar.addEventListener("click", function () {
    if (!usuarioAvatarFoto.src) {
        inputFotoPerfil.click();
        return;
    }

    modalFotoImagem.src = usuarioAvatarFoto.src;
    modalFotoPerfil.style.display = "flex";
});

fecharModalFoto.addEventListener("click", function () {
    modalFotoPerfil.style.display = "none";
});

trocarFotoPerfil.addEventListener("click", function () {
    modalFotoPerfil.style.display = "none";
    inputFotoPerfil.click();
});

modalFotoPerfil.addEventListener("click", function (event) {
    if (event.target === modalFotoPerfil) {
        modalFotoPerfil.style.display = "none";
    }
});

inputFotoPerfil.addEventListener("change", function () {
    const arquivo = inputFotoPerfil.files[0];

    if (!arquivo) {
        return;
    }

    const leitor = new FileReader();

leitor.onload = function () {
    avatarFoto.src = leitor.result;
    avatarFoto.style.display = "block";
    avatarLetra.style.display = "none";

    usuarioAvatarFoto.src = leitor.result;
    usuarioAvatarFoto.style.display = "block";
    usuarioAvatarLetra.style.display = "none";
    localStorage.setItem("fotoPerfil", leitor.result);
};

    leitor.readAsDataURL(arquivo);
});

let conversas = [];
let conversaAtual = null;
const conversasSalvas = localStorage.getItem("conversas");
if (conversasSalvas) {
    conversas = JSON.parse(conversasSalvas);
}


conversas = conversas.filter(function (conversa) {
    return Array.isArray(conversa.mensagens) && conversa.mensagens.length > 0;
});

localStorage.setItem("conversas", JSON.stringify(conversas));

if (conversas.some(function (item) {
    return typeof item === "string";
})) {
    const conversasMigradas = [];
    let conversaTemporaria = null;

    conversas.forEach(function (item) {
        if (typeof item === "string") {
            if (conversaTemporaria === null) {
                conversaTemporaria = {
                    id: Date.now(),
                    titulo: "Conversa anterior",
                    mensagens: []
                };

                conversasMigradas.push(conversaTemporaria);
            }

            conversaTemporaria.mensagens.push({
                autor: "usuario",
                texto: item
            });
        } else {
            conversasMigradas.push(item);
            conversaTemporaria = item;
        }
    });

    conversas = conversasMigradas;
    localStorage.setItem("conversas", JSON.stringify(conversas));
}

const conversaAtualId = localStorage.getItem("conversaAtualId");

if (conversaAtualId) {
    conversaAtual = conversas.find(function (conversa) {
        return String(conversa.id) === conversaAtualId;
    }) || null;
} else {
    conversaAtual = null;
}

if (conversaAtual) {
    telaInicial.style.display = "none";
    telaChat.style.display = "flex";
} else {
    telaInicial.style.display = "flex";
    telaChat.style.display = "none";
}

function carregarMensagensDaConversa() {
    areaMensagens.innerHTML = "";

    if (!conversaAtual || !Array.isArray(conversaAtual.mensagens)) {
        return;
    }

conversaAtual.mensagens.forEach(function (mensagem, indice) {
        if (mensagem.autor === "ia") {
            const mensagemElemento = document.createElement("div");
            const logoIA = document.createElement("img");
            logoIA.src = "logo.png";
            logoIA.alt = "Logo Gustaguest";
            logoIA.classList.add("logo-mensagem-ia");

            areaMensagens.appendChild(logoIA);
            mensagemElemento.innerHTML = DOMPurify.sanitize(
                marked.parse(mensagem.texto)
            );

            mensagemElemento.classList.add("mensagem-ia");
            areaMensagens.appendChild(mensagemElemento);

        } else {
            const containerUsuario = document.createElement("div");
            containerUsuario.classList.add("container-mensagem-usuario");

            const avatarUsuario = document.createElement("div");
            avatarUsuario.classList.add("avatar-mensagem-usuario");

            const fotoPerfilAtual = localStorage.getItem("fotoPerfil");

            if (fotoPerfilAtual) {
                const imagemAvatar = document.createElement("img");
                imagemAvatar.src = fotoPerfilAtual;
                imagemAvatar.alt = "Foto do usuário";
                avatarUsuario.appendChild(imagemAvatar);
            } else {
                avatarUsuario.textContent = "G";
            }

            const mensagemElemento = document.createElement("div");
            mensagemElemento.textContent = mensagem.texto;
            mensagemElemento.classList.add("mensagem-usuario");

            const acoesMensagem = document.createElement("div");
            acoesMensagem.classList.add("acoes-mensagem");

            const botaoEditar = document.createElement("button");
            botaoEditar.type = "button";
            botaoEditar.textContent = "Editar";
            botaoEditar.classList.add("botao-editar-mensagem");

           botaoEditar.addEventListener("click", function () {
    const caixaEdicao = document.createElement("div");
    caixaEdicao.classList.add("caixa-edicao-mensagem");

    const campoEdicao = document.createElement("textarea");
    campoEdicao.classList.add("campo-edicao-mensagem");
    campoEdicao.value = mensagem.texto;

    const acoesEdicao = document.createElement("div");
    acoesEdicao.classList.add("acoes-edicao-mensagem");

    const botaoCancelarEdicao = document.createElement("button");
    botaoCancelarEdicao.type = "button";
    botaoCancelarEdicao.textContent = "Cancelar";
    botaoCancelarEdicao.classList.add("botao-cancelar-edicao");

    const botaoSalvarEdicao = document.createElement("button");
    botaoSalvarEdicao.type = "button";
    botaoSalvarEdicao.textContent = "Salvar";
    botaoSalvarEdicao.classList.add("botao-salvar-edicao");

campoEdicao.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        botaoSalvarEdicao.click();
    }
});

    acoesEdicao.appendChild(botaoCancelarEdicao);
    acoesEdicao.appendChild(botaoSalvarEdicao);

    caixaEdicao.appendChild(campoEdicao);
    caixaEdicao.appendChild(acoesEdicao);

    mensagemElemento.style.display = "none";
    acoesMensagem.style.display = "none";

    containerUsuario.appendChild(caixaEdicao);

    campoEdicao.focus();
    campoEdicao.setSelectionRange(
        campoEdicao.value.length,
        campoEdicao.value.length
    );

    botaoCancelarEdicao.addEventListener("click", function () {
        caixaEdicao.remove();
        mensagemElemento.style.display = "";
        acoesMensagem.style.display = "";
    });

   botaoSalvarEdicao.addEventListener("click", async function () {
        const textoEditado = campoEdicao.value.trim();

        if (textoEditado === "") {
            return;
        }

        conversaAtual.mensagens[indice].texto = textoEditado;

        localStorage.setItem(
            "conversas",
            JSON.stringify(conversas)
        );

        await regenerarRespostaIA(indice);
    });
});

            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.textContent = "Excluir";
            botaoExcluir.classList.add("botao-excluir-mensagem");
            botaoExcluir.addEventListener("click", function () {
    const confirmarExclusao = confirm("Deseja excluir esta mensagem?");

    if (!confirmarExclusao) {
        return;
    }

    conversaAtual.mensagens.splice(indice, 1);

    localStorage.setItem(
        "conversas",
        JSON.stringify(conversas)
    );

    carregarMensagensDaConversa();
});

            acoesMensagem.appendChild(botaoEditar);
            acoesMensagem.appendChild(botaoExcluir);

            containerUsuario.appendChild(avatarUsuario);
            containerUsuario.appendChild(mensagemElemento);

            areaMensagens.appendChild(containerUsuario);
            containerUsuario.appendChild(acoesMensagem);
        }
    });
}

carregarMensagensDaConversa();

function criarNovaConversa() {
    conversaAtual = {
        id: Date.now(),
        titulo: "Nova conversa",
        mensagens: []
    };
    
    areaMensagens.innerHTML = "";
    localStorage.removeItem("conversaAtualId");
}

function atualizarHistorico() {
    historicoChats.innerHTML = "";
    [...conversas].reverse().forEach(function (conversa) {
    const itemHistorico = document.createElement("button");
    const botaoExcluir = document.createElement("span");
    botaoExcluir.textContent = "×";
    botaoExcluir.classList.add("excluir-conversa");
    const tituloConversa = document.createElement("span");
    tituloConversa.textContent = conversa.titulo;
    tituloConversa.classList.add("titulo-conversa");

    itemHistorico.appendChild(tituloConversa);
    itemHistorico.appendChild(botaoExcluir);
    if (conversaAtual && conversa.id === conversaAtual.id) {
    itemHistorico.classList.add("conversa-ativa");
}

botaoExcluir.addEventListener("click", function (event) {
    event.stopPropagation();

    conversas = conversas.filter(function (item) {
        return item.id !== conversa.id;
    });

    localStorage.setItem("conversas", JSON.stringify(conversas));

    if (conversaAtual && conversaAtual.id === conversa.id) {
        conversaAtual = null;
        areaMensagens.innerHTML = "";
    }

    atualizarHistorico();
});

itemHistorico.addEventListener("click", function () {
    conversaAtual = conversa;

    localStorage.setItem(
        "conversaAtualId",
        String(conversa.id)
    );

    atualizarHistorico();
    carregarMensagensDaConversa();
});

        historicoChats.appendChild(itemHistorico);
    });
}

atualizarHistorico();

function enviarMensagem() {
    const mensagem = campoPergunta.value.trim();

    if (mensagem === "") {
        telaInicial.style.display = "none";
        telaChat.style.display = "flex";
        return;
    }

    campoPergunta.value = "";

    criarNovaConversa();

    telaInicial.style.display = "none";
    telaChat.style.display = "flex";

    campoChat.value = mensagem;
    enviarMensagemChat();
}

async function gerarTituloDaConversa(conversa, mensagem) {
    const tituloAlternativo = mensagem
        .split(/\s+/)
        .slice(0, 5)
        .join(" ")
        .slice(0, 50);

    conversa.titulo = tituloAlternativo;
    atualizarHistorico();

    try {
        const instrucaoTitulo = `
Crie um título curto em português para a conversa.
Use no máximo 5 palavras. Mostre somente o título, sem aspas e sem ponto final.
`;

        const tituloGerado = await consultarAzure(
            mensagem,
            [],
            instrucaoTitulo
        );

        conversa.titulo = tituloGerado
            .replace(/^["'“”]+|["'“”]+$/g, "")
            .replace(/[.!?]+$/, "")
            .slice(0, 50);
    } catch (erro) {
        console.error("Erro ao gerar título:", erro);
    }

    localStorage.setItem("conversas", JSON.stringify(conversas));
    atualizarHistorico();
}

async function enviarMensagemChat() {
    const mensagem = campoChat.value.trim();

    if (mensagem === "") {
        return;
    }

   if (conversaAtual === null || !Array.isArray(conversaAtual.mensagens)) {
    criarNovaConversa();
}

if (!conversas.includes(conversaAtual)) {
    conversas.push(conversaAtual);
    localStorage.setItem(
    "conversaAtualId",
    String(conversaAtual.id)
);
    atualizarHistorico();
}

    const containerUsuario = document.createElement("div");
containerUsuario.classList.add("container-mensagem-usuario");

const mensagemUsuario = document.createElement("div");
mensagemUsuario.textContent = mensagem;
mensagemUsuario.classList.add("mensagem-usuario");

const avatarUsuario = document.createElement("div");
avatarUsuario.classList.add("avatar-mensagem-usuario");

const fotoPerfilAtual = localStorage.getItem("fotoPerfil");

if (fotoPerfilAtual) {
    const imagemAvatar = document.createElement("img");
    imagemAvatar.src = fotoPerfilAtual;
    imagemAvatar.alt = "Foto do usuário";
    avatarUsuario.appendChild(imagemAvatar);
} else {
    avatarUsuario.textContent = "G";
}

containerUsuario.appendChild(avatarUsuario);
containerUsuario.appendChild(mensagemUsuario);

areaMensagens.appendChild(containerUsuario);
    conversaAtual.mensagens.push({
    autor: "usuario",
    texto: mensagem
});

if (conversaAtual.mensagens.length === 1) {
    gerarTituloDaConversa(conversaAtual, mensagem);
}

localStorage.setItem("conversas", JSON.stringify(conversas));
carregarMensagensDaConversa();
campoChat.value = "";
const mensagemIA = document.createElement("div");
mensagemIA.classList.add("mensagem-ia");
mensagemIA.classList.add("mensagem-pensando");
mensagemIA.textContent = "Gustaguest pensando...";
areaMensagens.appendChild(mensagemIA);

rolagemChat.scrollTop = rolagemChat.scrollHeight;
try {
    const respostaCompleta = await consultarAzure(
        mensagem,
        conversaAtual.mensagens.slice(0, -1)
    );

    mensagemIA.classList.remove("mensagem-pensando");
    mensagemIA.innerHTML = DOMPurify.sanitize(
        marked.parse(respostaCompleta)
    );

    conversaAtual.mensagens.push({
        autor: "ia",
        texto: respostaCompleta
    });

    localStorage.setItem("conversas", JSON.stringify(conversas));
} catch (erro) {
    console.error("Erro ao consultar a Azure:", erro);
    mensagemIA.classList.remove("mensagem-pensando");

    mensagemIA.textContent = erro.message === "AZURE_NAO_CONFIGURADA"
        ? "Configure a URL e a chave da Azure no início do arquivo script.js."
        : "O Gustaguest está temporariamente indisponível. Tente novamente em alguns minutos.";
}

rolagemChat.scrollTop = rolagemChat.scrollHeight;
}

async function regenerarRespostaIA(indiceMensagemUsuario) {
    const mensagemUsuario = conversaAtual.mensagens[indiceMensagemUsuario];

    if (!mensagemUsuario || mensagemUsuario.autor !== "usuario") {
        return;
    }

    const indiceRespostaIA = indiceMensagemUsuario + 1;

    const historicoAnterior = conversaAtual.mensagens.slice(
        0,
        indiceMensagemUsuario
    );

    let respostaCompleta;

    try {
        respostaCompleta = await consultarAzure(
            mensagemUsuario.texto,
            historicoAnterior
        );
    } catch (erro) {
        console.error("Erro ao regenerar resposta:", erro);
        alert("Não foi possível regenerar a resposta agora.");
        return;
    }

    const novaResposta = {
        autor: "ia",
        texto: respostaCompleta
    };

    if (
        conversaAtual.mensagens[indiceRespostaIA] &&
        conversaAtual.mensagens[indiceRespostaIA].autor === "ia"
    ) {
        conversaAtual.mensagens[indiceRespostaIA] = novaResposta;
    } else {
        conversaAtual.mensagens.splice(
            indiceRespostaIA,
            0,
            novaResposta
        );
    }

    localStorage.setItem(
        "conversas",
        JSON.stringify(conversas)
    );

    carregarMensagensDaConversa();
}

botaoEnviar.addEventListener("click", enviarMensagem);
botaoNovaConversa.addEventListener("click", criarNovaConversa);
campoPergunta.addEventListener
("keydown", function (event) {
    if (event.key === "Enter") {
        enviarMensagem();
    }
}
);
botaoChatEnviar.addEventListener("click", enviarMensagemChat);
campoChat.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        enviarMensagemChat();
    }
});

console.log(conversas);

const botaoMenuLateralResponsivo = document.querySelector(
    ".botao-menu-sidebar"
);

const painelSidebarResponsivo = document.querySelector(".sidebar");

if (botaoMenuLateralResponsivo && painelSidebarResponsivo) {
    botaoMenuLateralResponsivo.addEventListener("click", function () {
        const menuEstaAberto =
            painelSidebarResponsivo.classList.toggle("aberta");

        botaoMenuLateralResponsivo.setAttribute(
            "aria-expanded",
            String(menuEstaAberto)
        );
    });

    document.addEventListener("click", function (evento) {
        const clicouNoMenu =
            painelSidebarResponsivo.contains(evento.target);

        const clicouNoBotao =
            botaoMenuLateralResponsivo.contains(evento.target);

        if (
            window.innerWidth <= 768 &&
            painelSidebarResponsivo.classList.contains("aberta") &&
            !clicouNoMenu &&
            !clicouNoBotao
        ) {
            painelSidebarResponsivo.classList.remove("aberta");

            botaoMenuLateralResponsivo.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 768) {
            painelSidebarResponsivo.classList.remove("aberta");

            botaoMenuLateralResponsivo.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    });
}
