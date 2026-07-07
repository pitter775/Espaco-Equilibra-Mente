$(function () {
  'use strict';

  var dtUserTable = $('.user-list-table');
  var newUserModal = $('#newUserModal');
  var tableUser = false;
  var reservasCache = {};

  $.fn.dataTable.ext.errMode = 'none';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getStatusMeta(status) {
    var statusNormalizado = String(status || '').toUpperCase();

    switch (statusNormalizado) {
      case 'CONFIRMADA':
        return { label: 'Confirmada', className: 'reserva-status-confirmada' };
      case 'PENDENTE':
        return { label: 'Pendente', className: 'reserva-status-pendente' };
      case 'CANCELADA':
        return { label: 'Cancelada', className: 'reserva-status-cancelada' };
      default:
        return { label: statusNormalizado || 'Desconhecido', className: 'reserva-status-default' };
    }
  }

  function renderStatusBadge(status) {
    var meta = getStatusMeta(status);
    return '<span class="reserva-status-badge ' + meta.className + '">' +
      '<span class="reserva-status-dot"></span>' +
      '<span>' + meta.label + '</span>' +
      '</span>';
  }

  function formatarData(data) {
    if (!data) {
      return 'Nao informada';
    }

    var partes = String(data).split('T')[0].split('-');
    if (partes.length !== 3) {
      return data;
    }

    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  function formatarDataLonga(data) {
    if (!data) {
      return 'Data nao informada';
    }

    var dataObj = new Date(data + 'T12:00:00');
    if (Number.isNaN(dataObj.getTime())) {
      return data;
    }

    return dataObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function formatarHorario(inicio, fim) {
    var horaInicio = String(inicio || '').slice(0, 5);
    var horaFim = String(fim || '').slice(0, 5);
    return horaInicio + ' às ' + horaFim;
  }

  function formatarMoeda(valor) {
    var numero = Number(valor || 0);
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function calcularHorasReserva(dados) {
    var horarios = Array.isArray(dados.horarios) && dados.horarios.length
      ? dados.horarios
      : [{ hora_inicio: dados.hora_inicio, hora_fim: dados.hora_fim }];

    return horarios.reduce(function (total, item) {
      var inicio = String(item.hora_inicio || '').split(':');
      var fim = String(item.hora_fim || '').split(':');

      if (inicio.length < 2 || fim.length < 2) {
        return total;
      }

      var minutosInicio = (Number(inicio[0]) * 60) + Number(inicio[1]);
      var minutosFim = (Number(fim[0]) * 60) + Number(fim[1]);
      var diferenca = minutosFim - minutosInicio;

      if (!Number.isFinite(diferenca) || diferenca <= 0) {
        return total;
      }

      return total + (diferenca / 60);
    }, 0);
  }

  function calcularValorTotal(dados) {
    var valorHora = Number(dados && dados.sala ? dados.sala.valor : 0);
    return valorHora * calcularHorasReserva(dados);
  }

  function getInitials(nome) {
    var partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) {
      return 'CL';
    }

    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }

    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function preencherFiltroSalas(lista) {
    var select = $('#filtro-sala-reserva');
    var salas = [];
    var vistos = {};

    select.find('option:not(:first)').remove();

    (lista || []).forEach(function (item) {
      var nomeSala = item && item.sala && item.sala.nome ? item.sala.nome : '';
      if (nomeSala && !vistos[nomeSala]) {
        vistos[nomeSala] = true;
        salas.push(nomeSala);
      }
    });

    salas.sort().forEach(function (nomeSala) {
      select.append('<option value="' + escapeHtml(nomeSala) + '">' + escapeHtml(nomeSala) + '</option>');
    });
  }

  function abrirModalReserva(dados) {
    var nomeCliente = dados.usuario && dados.usuario.name ? dados.usuario.name : 'Cliente nao identificado';
    var emailCliente = dados.usuario && dados.usuario.email ? dados.usuario.email : 'Email nao informado';
    var telefoneCliente = dados.usuario && dados.usuario.telefone ? dados.usuario.telefone : 'Telefone nao informado';
    var salaNome = dados.sala && dados.sala.nome ? dados.sala.nome : 'Sala nao encontrada';
    var endereco = dados.sala && dados.sala.endereco
      ? [
          dados.sala.endereco.rua,
          dados.sala.endereco.numero,
          dados.sala.endereco.bairro,
          [dados.sala.endereco.cidade, dados.sala.endereco.estado].filter(Boolean).join('/')
        ].filter(Boolean).join(', ')
      : 'Endereco nao informado';
    var imagem = dados.sala && dados.sala.imagens && dados.sala.imagens[0] && dados.sala.imagens[0].imagem_base64
      ? dados.sala.imagens[0].imagem_base64
      : '/sem-imagem.jpg';
    var horarios = Array.isArray(dados.horarios) && dados.horarios.length
      ? dados.horarios
      : [{ hora_inicio: dados.hora_inicio, hora_fim: dados.hora_fim }];
    var valorHora = dados.sala && dados.sala.valor ? formatarMoeda(dados.sala.valor) : 'Nao informado';
    var valorTotal = formatarMoeda(calcularValorTotal(dados));
    var statusMeta = getStatusMeta(dados.status);
    var podeCancelar = String(dados.status || '').toUpperCase() !== 'CANCELADA';
    var salaId = dados.sala && dados.sala.id ? dados.sala.id : '';

    $('#modalReservaKicker').text('Reserva #' + dados.id);
    $('#modalReservaSala').text(salaNome);
    $('#modalReservaPeriodo').text(formatarDataLonga(dados.data_reserva) + ' • ' + formatarHorario(dados.hora_inicio, dados.hora_fim));
    $('#modalReservaImagem').attr('src', imagem);
    $('#modalReservaStatus').html(renderStatusBadge(dados.status));
    $('#modalReservaCliente').html(
      '<strong>' + escapeHtml(nomeCliente) + '</strong><br>' +
      escapeHtml(emailCliente) + '<br>' +
      escapeHtml(telefoneCliente)
    );
    $('#modalReservaPagamento').html(
      '<strong>Valor por hora:</strong> ' + escapeHtml(valorHora) + '<br>' +
      '<strong>Valor total:</strong> ' + escapeHtml(valorTotal) + '<br>' +
      '<strong>Status da reserva:</strong> ' + escapeHtml(statusMeta.label)
    );
    $('#modalReservaEndereco').html(escapeHtml(endereco));
    $('#modalReservaHorarios').html(
      horarios.map(function (item) {
        return '<li>' + escapeHtml(formatarHorario(item.hora_inicio, item.hora_fim)) + '</li>';
      }).join('')
    );
    $('#btnCancelarReservaModal')
      .attr('data-id', dados.id)
      .prop('disabled', !podeCancelar)
      .toggle(podeCancelar);
    $('#modalReservaSalaLink')
      .attr('href', salaId ? '/admin/salas?editar=' + salaId : '/admin/salas')
      .toggle(!!salaId);
    $('#modalReservaRodape').text(
      podeCancelar
        ? 'Confira os dados antes de cancelar esta reserva.'
        : 'Esta reserva ja esta cancelada e nao possui novas acoes.'
    );

    $('#modalReservaDetalhe').modal('show');
  }

  dtUserTable.on('error.dt', function (e, settings, techNote, message) {
    console.error('DataTables error:', message);
    toastr.error('Nao foi possivel carregar a lista de reservas agora.');
  });

  function dataReservas() {
    if (tableUser) {
      tableUser.destroy();
    }

    tableUser = dtUserTable.DataTable({
      ajax: {
        url: '/admin/reservas/listar',
        dataSrc: function (json) {
          reservasCache = {};

          if (Array.isArray(json)) {
            json.forEach(function (item) {
              reservasCache[item.id] = item;
            });

            preencherFiltroSalas(json);
            return json;
          }

          preencherFiltroSalas([]);
          return [];
        },
        timeout: 15000,
        error: function (xhr) {
          if (xhr.status === 401) {
            toastr.warning('Sua sessao expirou. A tela sera recarregada.');
            setTimeout(function () {
              window.location.reload();
            }, 1200);
            return;
          }

          if (xhr.status === 403) {
            toastr.error('Voce nao tem permissao para acessar esta lista.');
            return;
          }

          toastr.error('Erro ao carregar reservas. Tente novamente em instantes.');
        }
      },
      deferRender: true,
      autoWidth: false,
      columns: [
        {
          data: function (dados) {
            var nome = dados.usuario && dados.usuario.name ? dados.usuario.name : 'Cliente nao identificado';
            var avatar = dados.usuario && dados.usuario.photo
              ? '<img src="' + escapeHtml(dados.usuario.photo) + '" alt="Avatar" class="reserva-avatar user-avatar" data-id="' + escapeHtml(dados.usuario.id || '') + '"/>'
              : '<span class="reserva-avatar-fallback user-avatar" data-id="' + escapeHtml(dados.usuario ? dados.usuario.id : '') + '">' + escapeHtml(getInitials(nome)) + '</span>';

            return '<div class="reserva-person">' +
              avatar +
              '<div>' +
                '<div class="reserva-person-name user-name" style="cursor:pointer" data-id="' + escapeHtml(dados.usuario ? dados.usuario.id : '') + '">' + escapeHtml(nome) + '</div>' +
                '<div class="reserva-person-meta">Reserva #' + escapeHtml(dados.id) + '</div>' +
              '</div>' +
            '</div>';
          }
        },
        {
          data: function (dados) {
            var email = dados.usuario && dados.usuario.email ? dados.usuario.email : 'Email nao informado';
            var telefone = dados.usuario && dados.usuario.telefone ? dados.usuario.telefone : 'Telefone nao informado';

            return '<div class="reserva-contact">' +
              '<strong>Contato</strong>' +
              escapeHtml(email) + '<br>' +
              escapeHtml(telefone) +
            '</div>';
          }
        },
        {
          data: function (dados) {
            var sala = dados.sala && dados.sala.nome ? dados.sala.nome : 'Sala nao encontrada';
            return '<div class="reserva-sala">' +
              '<strong>' + escapeHtml(sala) + '</strong>' +
              '<span>' + escapeHtml(dados.sala && dados.sala.valor ? formatarMoeda(dados.sala.valor) + '/hora' : 'Valor nao informado') + '</span>' +
            '</div>';
          }
        },
        {
          data: function (dados) {
            return '<div class="reserva-periodo">' +
              '<strong>' + escapeHtml(formatarDataLonga(dados.data_reserva)) + '</strong>' +
              '<span>' + escapeHtml(formatarHorario(dados.hora_inicio, dados.hora_fim)) + '</span>' +
            '</div>';
          }
        },
        {
          orderable: false,
          searchable: false,
          data: function (dados) {
            var podeCancelar = String(dados.status || '').toUpperCase() !== 'CANCELADA';
            var linkSala = dados.sala && dados.sala.id
              ? '<a href="/admin/salas?editar=' + escapeHtml(dados.sala.id) + '" class="btn btn-outline-secondary btn-sm">Sala</a>'
              : '';
            return '<div class="reserva-status-actions">' +
              renderStatusBadge(dados.status) +
              '<div class="reserva-actions">' +
                '<button class="btn btn-outline-primary abrir-modal-reserva btn-sm" data-id="' + escapeHtml(dados.id) + '">Detalhes</button>' +
                linkSala +
                (podeCancelar ? '<button class="btn btn-outline-danger cancelar-reserva btn-sm" data-id="' + escapeHtml(dados.id) + '">Cancelar</button>' : '') +
              '</div>' +
            '</div>';
          }
        }
      ],
      order: [[3, 'desc']],
      language: {
        url: datatablesLangUrl,
        paginate: { previous: '&nbsp;', next: '&nbsp;' }
      },
      initComplete: function () {
        var api = this.api();
        setTimeout(function () {
          api.columns.adjust();
        }, 0);
      },
      drawCallback: function () {
        this.api().columns.adjust();
      }
    });

    $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
      if (settings.nTable !== dtUserTable.get(0)) {
        return true;
      }

      var reserva = tableUser.row(dataIndex).data();
      if (!reserva) {
        return true;
      }

      var filtroStatus = $('#filtro-status-reserva').val();
      var filtroSala = $('#filtro-sala-reserva').val();
      var statusAtual = getStatusMeta(reserva.status).label;
      var salaAtual = reserva.sala && reserva.sala.nome ? reserva.sala.nome : '';

      if (filtroStatus && statusAtual !== filtroStatus) {
        return false;
      }

      if (filtroSala && salaAtual !== filtroSala) {
        return false;
      }

      return true;
    });
  }

  $(document).on('change', '#filtro-status-reserva, #filtro-sala-reserva', function () {
    if (tableUser) {
      tableUser.draw();
    }
  });

  $(window).on('resize', function () {
    if (tableUser) {
      tableUser.columns.adjust();
    }
  });

  $('#newUserModal').on('shown.bs.modal', function () {
    $('#endereco_cep').mask('00000-000');
    $('#telefone').mask('(00) 00000-0000');
  });

  $(document).on('click', '.user-avatar, .user-name', function () {
    var id = $(this).data('id');
    if (!id) {
      return;
    }

    $.get('/admin/usuarios/detalhes/' + id, function (data) {
      $('#id_geral').text(data.id);
      $('#fullname').text(data.name);
      $('#email').text(data.email);
      $('#cpf').text(data.cpf);
      $('#sexo').text(data.sexo);
      $('#idade').text(data.idade);
      $('#telefone').text(data.telefone);
      $('#photo').text(data.photo);
      $('#status').text(data.status);
      $('#perfil').text(data.tipo_usuario);
      $('#registro_profissional').text(data.registro_profissional);
      $('#tipo_registro_profissional').text(data.tipo_registro_profissional);

      if (data.endereco) {
        $('#endereco_rua').text(data.endereco.rua);
        $('#endereco_numero').text(data.endereco.numero);
        $('#endereco_complemento').text(data.endereco.complemento);
        $('#endereco_bairro').text(data.endereco.bairro);
        $('#endereco_cidade').text(data.endereco.cidade);
        $('#endereco_estado').text(data.endereco.estado);
        $('#endereco_cep').text(data.endereco.cep);
      } else {
        $('#endereco_rua, #endereco_numero, #endereco_complemento, #endereco_bairro, #endereco_cidade, #endereco_estado, #endereco_cep').text('');
      }

      newUserModal.modal('show');
    });
  });

  $(document).on('click', '.cancelar-reserva', function () {
    var reservaId = $(this).data('id');

    if (!confirm('Deseja realmente cancelar esta reserva?')) {
      return;
    }

    $.ajax({
      url: '/reserva/cancelar',
      method: 'POST',
      data: {
        reference_id: 'reserva_' + reservaId,
        _token: $('meta[name="csrf-token"]').attr('content')
      },
      success: function (response) {
        if (response.success) {
          toastr.success('Reserva cancelada com sucesso!');
          $('#modalReservaDetalhe').modal('hide');
          if (tableUser) {
            tableUser.ajax.reload(null, false);
          }
        } else {
          toastr.error('Falha ao cancelar reserva!');
        }
      },
      error: function () {
        toastr.error('Erro no servidor ao cancelar a reserva.');
      }
    });
  });

  $(document).on('click', '.abrir-modal-reserva', function () {
    var dados = reservasCache[$(this).data('id')];

    if (!dados) {
      toastr.error('Nao foi possivel carregar os detalhes da reserva.');
      return;
    }

    abrirModalReserva(dados);
  });

  dataReservas();
});
