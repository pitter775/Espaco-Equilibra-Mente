/*=========================================================================================
    File Name: app-ecommerce.js
    Description: Ecommerce pages js
    ----------------------------------------------------------------------------------------
    Item Name: Vuexy  - Vuejs, HTML & Laravel Admin Dashboard Template
    Author: PIXINVENT
    Author URL: http://www.themeforest.net/user/pixinvent
==========================================================================================*/

$(function () {
  'use strict';

  let pagamentoVerificado = false;
  let pagbankLink = null; // Armazena o link de pagamento
  let referenceId = null; // Armazena o ID da reserva
  let mercadopagoLink = null;
  let metodoPagamento = 'mercadopago';



  function iniciarVerificacaoPagamento(referenceId, metodo) {
    let tentativas = 0;
    console.log("🕵️‍♂️ Iniciando verificação de pagamento para:", referenceId, metodo);
  
    let intervalo = setInterval(() => {
      console.log(`🔁 Tentativa ${tentativas + 1}...`);
      if (pagamentoVerificado || tentativas >= 60) {
        console.log("🔚 Finalizando verificação. Sucesso:", pagamentoVerificado);
        clearInterval(intervalo);
        $('#modal-aguardando-pagamento').modal('hide');
  
        if (!pagamentoVerificado) {
          $('#modal-erro-pagamento').modal('show');
  
          // ⚠️ Aqui você notifica o backend para cancelar a reserva
          $.post('/reserva/cancelar', { reference_id: referenceId });
        }
  
        return;
      }
  
      $.ajax({
        url: `/${metodo}/status/${referenceId}`,
        method: 'GET',
        success: function (response) {
          console.log("📩 Status do pagamento:", response);
  
          if (response.status === 'PAGA') {
            pagamentoVerificado = true;
            clearInterval(intervalo);
            $('#modal-aguardando-pagamento').modal('hide');
            $('#modal-sucesso-pagamento').modal('show');
            setTimeout(() => {
              window.location.href = '/cliente/reservas';
            }, 3000);
          } else if (['REJEITADA', 'CANCELADA'].includes(response.status)) {
            clearInterval(intervalo);
            $('#modal-aguardando-pagamento').modal('hide');
            $('#modal-erro-pagamento').modal('show');
  
            // ❌ Cancela a reserva no backend
            $.post('/reserva/cancelar', { reference_id: referenceId });
          }
        },
        error: function (xhr) {
          console.error("❌ Erro ao verificar pagamento:", xhr.responseText);
        }
      });
  
      tentativas++;
    }, 5000);
  }
  
  
  


  $(document).ready(function () {
    atualizarDetalhes();

    // Antes de confirmar a reserva, buscar os dados do cliente do backend
    function buscarDadosCliente(reservaId) {
      return $.ajax({
        url: '/reserva/dados/' + reservaId, // Nova rota para obter os dados do backend
        method: 'GET',
        dataType: 'json'
      });
    }
    
    $('#confirmar-reserva').on('click', function () {
      console.log("🟡 Clique no botão de confirmar reserva");
      
      if (!$('#aceitoRegras').is(':checked')) {
        toastr.error('Você precisa aceitar o regulamento antes de continuar.');
        return false;
      }
    
      // 🔓 abre janela ANTES do AJAX
      let janelaPagamento = window.open('', '_blank');
    
      $.ajax({
        url: '/reserva/confirmar',
        method: 'POST',
        data: {
          _token: $('meta[name="csrf-token"]').attr('content'),
          metodo_pagamento: metodoPagamento
        },
        success: function (response) {
          // pega a URL de redirecionamento (normal ou JsonResponse)
          let redirectUrl = response?.redirect;
          if (typeof response?.original === 'object' && response.original.redirect) {
            redirectUrl = response.original.redirect;
          }
        
          console.log('➡️ Link final:', redirectUrl);
        
          if (redirectUrl) {
            // normaliza relativa → absoluta
            if (!/^https?:\/\//i.test(redirectUrl)) {
              redirectUrl = new URL(redirectUrl, window.location.origin).href;
            }
            // manda a nova aba pro checkout
            try {
              try { janelaPagamento.document.write('<p style="font-family:sans-serif;padding:16px">Abrindo checkout…</p>'); } catch(_) {}
              janelaPagamento.location.replace(redirectUrl);
            } catch(_) {
              window.open(redirectUrl, '_blank');
              try { janelaPagamento.close(); } catch(_) {}
            }
        
            // modal + polling
            $('#modal-aguardando-pagamento').modal('show');
            referenceId = response?.reference_id || null;
            if (referenceId) iniciarVerificacaoPagamento(referenceId, metodoPagamento);
          } else {
            // ❗ sem link? fecha a aba em branco e segue o fluxo sem barulho
            try { janelaPagamento.close(); } catch(_) {}
            window.location.href = '/cliente/reservas';
          }
        },
        
        error: function (xhr) {
          // ❗ qualquer erro → fecha a about:blank e leva para "Minhas Reservas"
          try { janelaPagamento.close(); } catch(_) {}
          window.location.href = '/cliente/reservas';
        }
        
      });
    
      return false;
    });
    
    
  

  
  
  

    // Redireciona para a tela de reservas do cliente ao fechar o modal
    $('#modal-ok-button').on('click', function () {
        window.location.href = '/cliente/reservas'; // Página de reservas do cliente
    });
});

  // Função para recalcular os detalhes do carrinho
  function atualizarDetalhes() {
      let totalHoras = -1;
      let valorTotal = 0;

      // Itera sobre os itens restantes no carrinho
      $('.ecommerce-card').each(function () {
          // Extrai e processa o valor do item
          const valorTexto = $(this).find('.item-price').text().trim().replace('R$', '').replace('.', '').replace(',', '.'); // Remove 'R$', substitui ponto por nada e vírgula por ponto
          const valorItem = parseFloat(valorTexto); // Converte para número decimal

          // Confere se o valor é válido
          if (!isNaN(valorItem)) {
              valorTotal += valorItem; // Soma o valor do item ao total
          }

          // Horários reservados (cada item = 1 hora)
          totalHoras += 1;
      });

      // Atualiza o DOM com os novos valores
      $('.quantidade-horas').text(`${totalHoras}hs`);
      $('.valor-total').text(`R$ ${valorTotal.toFixed(2).replace('.', ',')}`);
  }

  var quantityCounter = $('.quantity-counter'),
    CounterMin = 1,
    CounterMax = 10,
    bsStepper = document.querySelectorAll('.bs-stepper'),
    checkoutWizard = document.querySelector('.checkout-tab-steps'),
    removeItem = $('.remove-wishlist'),
    moveToCart = $('.move-cart'),
    isRtl = $('html').attr('data-textdirection') === 'rtl';

  // remove items from wishlist page
  removeItem.on('click', function () {
    $(this).closest('.ecommerce-card').remove();
    atualizarDetalhes();
    toastr['error']('', 'Item Removido 🗑️', {
      closeButton: true,
      tapToDismiss: false,
      rtl: isRtl
    });
  });


  // move items to cart
  moveToCart.on('click', function () {
    $(this).closest('.ecommerce-card').remove();

  });

  // Checkout Wizard

  // Adds crossed class
  if (typeof bsStepper !== undefined && bsStepper !== null) {
    for (var el = 0; el < bsStepper.length; ++el) {
      bsStepper[el].addEventListener('show.bs-stepper', function (event) {
        var index = event.detail.indexStep;
        var numberOfSteps = $(event.target).find('.step').length - 1;
        var line = $(event.target).find('.step');

        // The first for loop is for increasing the steps,
        // the second is for turning them off when going back
        // and the third with the if statement because the last line
        // can't seem to turn off when I press the first item. ¯\_(ツ)_/¯

        for (var i = 0; i < index; i++) {
          line[i].classList.add('crossed');

          for (var j = index; j < numberOfSteps; j++) {
            line[j].classList.remove('crossed');
          }
        }
        if (event.detail.to == 0) {
          for (var k = index; k < numberOfSteps; k++) {
            line[k].classList.remove('crossed');
          }
          line[0].classList.remove('crossed');
        }
      });
    }
  }

  // Init Wizard
  if (typeof checkoutWizard !== undefined && checkoutWizard !== null) {
    var wizard = new Stepper(checkoutWizard, {
      linear: false
    });

    $(checkoutWizard)
      .find('.btn-next')
      .each(function () {
        $(this).on('click', function (e) {
          wizard.next();
        });
      });

    $(checkoutWizard)
      .find('.btn-prev')
      .on('click', function () {
        wizard.previous();
      });
  }

  // checkout quantity counter
  if (quantityCounter.length > 0) {
    quantityCounter
      .TouchSpin({
        min: CounterMin,
        max: CounterMax
      })
      .on('touchspin.on.startdownspin', function () {
        var $this = $(this);
        $('.bootstrap-touchspin-up').removeClass('disabled-max-min');
        if ($this.val() == 1) {
          $(this).siblings().find('.bootstrap-touchspin-down').addClass('disabled-max-min');
        }
      })
      .on('touchspin.on.startupspin', function () {
        var $this = $(this);
        $('.bootstrap-touchspin-down').removeClass('disabled-max-min');
        if ($this.val() == 10) {
          $(this).siblings().find('.bootstrap-touchspin-up').addClass('disabled-max-min');
        }
      });
  }
});
