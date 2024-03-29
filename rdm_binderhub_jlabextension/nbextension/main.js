define([
  'jquery',
  'base/js/utils',
  'base/js/dialog',
], function(
  $,
  utils,
  jsdialog,
) {
    "use strict";

    var mod_name = 'rdm_binderhub_nbextension';
    var log_prefix = '[' + mod_name + ']';

    function get_api_url() {
        var baseUrl = utils.get_body_data('baseUrl');
        return utils.url_path_join(baseUrl, 'rdm-binderhub-jlabextension/files');
    }

    function get_icon_url() {
        var baseUrl = utils.get_body_data('baseUrl');
        return utils.url_path_join(baseUrl, 'nbextensions/rdm_binderhub_jlabextension/GRDM_logo_horizon.svg')
    }

    function refresh_button(syncing) {
        $('#rdm-binderhub-sync-button')
            .removeClass('btn-danger')
            .removeClass('btn-warning')
            .addClass('btn-default')
            .attr('title', '')
            .attr('disabled', syncing);
        $('#rdm-binderhub-sync-button > span')
            .text(syncing ? ' Syncing to RDM...' : ' Sync to RDM');
    }

    function format_short_warn_message(action) {
        if (action.id === 'no_content') {
          return 'No `result` directory';
        }
        if (action.id === 'not_directory') {
          return '`result` is not a directory';
        }
        if (action.id === 'empty_directory') {
            return '`result` has no files';
        }
        if (action.id === 'already_syncing') {
          return 'Already syncing';
        }
        return action.id;
    }

    function format_warn_message(action) {
        var message = format_short_warn_message(action);
        return message + ': ' + (action.args || []).join(', ');
    }

    function reload_button_state() {
        $.ajax({
            url: get_api_url(),
            xhrFields: {
                withCredentials: true
            },
        })
            .done(function(data) {
                console.log('Done', data);
                if (!data.syncing && data.last_result && data.last_result.exit_code != 0) {
                  console.error('Sync error', data.last_result);
                  set_error_message('command failed')
                      .attr('title', data.last_result.stderr);
                  return;
                }
                if (!data.to_dir) {
                  console.log('No GakuNin RDM folder');
                  $('#rdm-binderhub-sync-button')
                      .attr('disabled', false)
                      .click(function() {
                          var message = get_no_grdm_message();
                          jsdialog.modal({
                              title: message.title,
                              body: $('<div></div>').html(message.body),
                              buttons: {
                                  "OK" : {},
                              }
                          });
                      });
                  return;
                }
                $('#rdm-binderhub-sync-button').click(function() {
                    refresh_button(true);
                    $.ajax({
                        url: get_api_url() + '?action=sync',
                        xhrFields: {
                            withCredentials: true
                        },
                    })
                        .done(function(data) {
                            console.log('Done', data);
                            var current_action = data.action;
                            if (!data.syncing && current_action && current_action.id !== 'started') {
                              console.warn('Sync failed', current_action);
                              set_warn_message(format_short_warn_message(current_action))
                                  .attr('title', format_warn_message(current_action));
                              return;
                            }
                            reload_button_state();
                        })
                        .fail(show_error);
                });
                refresh_button(data.syncing);
                if (!data.syncing) {
                    return;
                }
                setTimeout(reload_button_state, 1000);
            })
            .fail(show_error);
    }

    function get_no_grdm_message() {
        var url = 'https://support.rdm.nii.ac.jp/usermanual/50/';
        if (/^ja/i.test(navigator.language)) {
            return {
                title: 'GakuNin RDM連携環境で実行されていません',
                body: 'この環境はGakuNin RDM連携環境ではありません。<br><a href="' + url + '" target="_blank">GakuNin RDMと連携した環境</a>でこのExtensionを実行することで、Jupyter Notebookで作成したデータをGakuNin RDMに保存することができます。',
            }
        }
        return {
            title: 'Not running in a GakuNin RDM linked environment',
            body: 'The current environment is not a GakuNin RDM linked environment.<br>By running this Extension in <a href="' + url + '" target="_blank">an environment linked to GakuNin RDM</a>, data created by Jupyter Notebook can be stored to GakuNin RDM.',
        };
    }

    function show_error(jqXHR, textStatus, errorThrown) {
        console.error('Failure', jqXHR, textStatus, errorThrown);
        set_error_message(textStatus || errorThrown)
    }

    function set_warn_message(msg) {
        var button = $('#rdm-binderhub-sync-button')
            .addClass('btn-warning')
            .removeClass('btn-danger')
            .removeClass('btn-default')
            .attr('title', '')
            .attr('disabled', false);
        $('#rdm-binderhub-sync-button > span')
            .text(' Sync Warning: ' + msg);
        return button;
    }

    function set_error_message(msg) {
        var button = $('#rdm-binderhub-sync-button')
            .addClass('btn-danger')
            .removeClass('btn-warning')
            .removeClass('btn-default')
            .attr('title', '')
            .attr('disabled', false);
        $('#rdm-binderhub-sync-button > span')
            .text(' Sync Error: ' + msg);
        return button;
    }

    function generate_button() {
        var button = $('<button></button>')
            .append($('<img></img>')
                .attr('src', get_icon_url())
                .attr('height', 16))
            .append($('<span></span>').text(' Sync to RDM'))
            .attr('id', 'rdm-binderhub-sync-button')
            .addClass('btn btn-default btn-sm')
            .attr('disabled', true);
        return $('<span></span>').attr('id', 'rdm_sync_widget').append(button);
    }

    function load_ipython_extension () {
        $('#login_widget').before(generate_button());
        reload_button_state();
    }

    return {
        load_ipython_extension: load_ipython_extension
    };

});
