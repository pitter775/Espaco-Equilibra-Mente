$(function () {
  'use strict';
  
  var dtUserTable = $('.user-list-table');
  var newUserModal = $('#newUserModal');
  var newUserForm = $('#newUserForm');
  var tableUser = false;

  // Função para carregar os dados na DataTable
  function datauser() {
      if (tableUser) {
          tableUser.destroy();
      }
      
      tableUser = dtUserTable.DataTable({
        ajax: { url: "/admin/usuarios/listar", dataSrc: "" },
        columns: [
            {
                data: function (dados) {
                    let image = dados.photo 
                        ? `<img src="${dados.photo}" alt="Avatar" class="user-avatar" height="26" width="26" data-id="${dados.id}"/>`
                        : `<img src="/app-assets/images/avatars/avatar.png" alt="Avatar" class="user-avatar" height="26" width="26" data-id="${dados.id}"/>`;
                    return `<div class="avatar">${image}</div>`;
                }
            },
            {
                data: function (dados) {
                    return `<span class="user-name" style="cursor:pointer" data-id="${dados.id}">${dados.name}</span>`;
                }
            },
            { data: 'email' },
            { data: 'telefone' }, // Exibe o telefone
            { 
                data: function (dados) {
                    return dados.tipo_usuario === 'cliente' ? 'Cliente' : 'Administrador';
                }
            },
            { 
                data: function (dados) {
                    let original = dados.created_at; // formato do banco
                    let formatada = new Date(original).toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
            
                    return `<span style="opacity:0;position:absolute;">${original}</span>${formatada}`;
                }
            },
            {
                data: function (dados) {
                    if (dados.status_aprovacao === 'aprovado') {
                        return '<span class="badge bg-success">Aprovado</span>';
                    } else if (dados.status_aprovacao === 'reprovado') {
                        return '<span class="badge bg-danger">Reprovado</span>';
                    } else {
                        return '<span class="badge bg-secondary">Pendente</span>';
                    }
                }
            }
        ],
        order: [[1, 'asc']], // Ordenação por Nome
        language: {
            url: datatablesLangUrl
        }
    });
    
    
    
  }

  // Resetar o modal para criação de novo usuário
  $(document).on('click', '.create-new', function () {
      newUserForm.trigger("reset"); // Reseta todos os campos do formulário
      $('#id_geral').val(''); // Limpa o campo de ID para indicar criação
      $('#senha').prop('required', true); // Exige a senha para novos usuários
      newUserModal.modal('show'); // Abre o modal
  });

    // Evento para abrir o modal ao clicar no nome ou na foto do usuário para visualização
    $(document).on('click', '.user-avatar, .user-name', function () {
        let id = $(this).data('id');
        $.get(`/admin/usuarios/detalhes/${id}`, function (data) {
            // Informações do usuário
            $('#fullname').text(data.name);
            $('#email').text(data.email);
            $('#cpf').text(data.cpf);
            $('#sexo').text(data.sexo);
            $('#idade').text(data.idade);
            $('#telefone').text(data.telefone);
            $('#registro_profissional').text(data.registro_profissional);
            $('#tipo_registro_profissional').text(data.tipo_registro_profissional);

            $('#documento_tipo').text(data.documento_tipo);

            if (data.documento_url) {
                $('#link_documento').attr('href', data.documento_url);
                $('#imagem_documento').attr('src', data.documento_url);
            } else {
                $('#link_documento').attr('href', '#');
                $('#imagem_documento').attr('src', '#');
            }

            // Informações de endereço
            if (data.endereco) {
                $('#endereco').text(
                    `${data.endereco.rua}, ${data.endereco.numero} ${data.endereco.complemento ?? ''} - ${data.endereco.bairro}, ${data.endereco.cidade} - ${data.endereco.estado}, CEP: ${data.endereco.cep}`
                );
            } else {
                $('#endereco').text('Endereço não cadastrado');
            }

            // Atualiza status de aprovação
            $('#status_aprovacao').removeClass('badge-secondary badge-success badge-danger');

            if (data.status_aprovacao === 'pendente') {
                $('#status_aprovacao').addClass('badge-secondary').text('Pendente');
            } else if (data.status_aprovacao === 'aprovado') {
                $('#status_aprovacao').addClass('badge-success').text('Aprovado');
            } else if (data.status_aprovacao === 'reprovado') {
                $('#status_aprovacao').addClass('badge-danger').text('Reprovado');
            } else {
                $('#status_aprovacao').addClass('badge-secondary').text('Indefinido');
            }


            $('#usuario_id_aprovacao').val(data.id);

            // Abre o modal
            newUserModal.modal('show');
        });
    });



  // Evento de submissão do formulário para criar ou editar
  newUserForm.on('submit', function (e) {
      e.preventDefault();
      let data = newUserForm.serialize();
      let url = $('#id_geral').val() ? `/admin/usuarios/atualizar/${$('#id_geral').val()}` : '/admin/usuarios/cadastrar';

      $.ajax({
          type: "POST",
          url: url,
          data: data,
          success: function () {
              datauser(); // Recarrega a tabela de usuários
              newUserModal.modal('hide'); // Fecha o modal após salvar
              toastr.success('Usuário salvo com sucesso!');
          },
          error: function (e) {
            let mensagemAmigavel = interpretarErro(e);
            toastr.error(mensagemAmigavel);
          }
      });
  });

    //Função para Aprovar Usuário 
    $('#formAprovacaoUsuario').on('submit', function (e) {
        e.preventDefault();
        let id = $('#usuario_id_aprovacao').val();

        $.post(`/admin/usuarios/${id}/aprovar`, function () {
            toastr.success('Usuário aprovado com sucesso!');
            datauser();
            newUserModal.modal('hide');
        }).fail(function (e) {
            let mensagemAmigavel = interpretarErro(e);
            toastr.error(mensagemAmigavel);
        });
    });


    //Função para Reprovar Usuário
    $('#btnReprovarUsuario').on('click', function () {
        let id = $('#usuario_id_aprovacao').val();

        $.post(`/admin/usuarios/${id}/reprovar`, function () {
            toastr.success('Usuário reprovado com sucesso!');
            datauser();
            newUserModal.modal('hide');
        }).fail(function (e) {
            let mensagemAmigavel = interpretarErro(e);
            toastr.error(mensagemAmigavel);
        });
    });


  datauser();
});
