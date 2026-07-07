$(function () {
  'use strict';
  
  var dtUserTable = $('.user-list-table');
  var newUserModal = $('#newUserModal');
  var newUserForm = $('#newUserForm');
  var tableUser = false;

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
              { data: 'tipo_usuario', render: tipo => tipo === 'cliente' ? 'Cliente' : 'Administrador' },
              {
                  data: function (dados) {
                      return dados.tipo_usuario === 'admin'
                          ? '<span class="badge bg-success">Admin</span>' 
                          : '<span class="badge bg-info">Cliente</span>';
                  }
              }
          ],
          order: [[1, 'asc']], // Ordenação por Nome
          language: {
              url: datatablesLangUrl,
              paginate: { previous: '&nbsp;', next: '&nbsp;' }
          }
      });
  }

  // Evento para abrir o modal ao clicar no nome ou na foto do usuário
  $(document).on('click', '.user-avatar, .user-name', function () {
      let id = $(this).data('id');
      $.get(`/admin/usuarios/detalhes/${id}`, function (data) {
          $('#id_geral').val(data.id);
          $('#fullname').val(data.name);
          $('#email').val(data.email);
          $('#perfil').val(data.tipo_usuario);
          $('#senha').prop('required', false); // Senha não obrigatória na edição
          newUserModal.modal('show'); // Abre o modal para edição
      });
  });

  // Evento de submissão do formulário
  newUserForm.on('submit', function (e) {
      e.preventDefault();
      let data = newUserForm.serialize();
      let url = $('#id_geral').val() ? `/admin/usuarios/atualizar/${$('#id_geral').val()}` : '/admin/usuarios/cadastrar';

      $.ajax({
          type: "POST",
          url: url,
          data: data,
          success: function () {
              datauser();
              newUserModal.modal('hide'); // Fecha o modal após salvar
              toastr.success('Usuário salvo com sucesso!');
          },
          error: function () {
              toastr.error('Erro ao salvar o usuário.');
          }
      });
  });

  datauser();
});
