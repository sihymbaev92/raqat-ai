# VPS SSH — CDN deploy үшін (бір рет)
#
# 1) Жергілікті public key:
#    type %USERPROFILE%\.ssh\id_ed25519.pub
#
# 2) VPS консолінде (Hetzner) root парольмен (тірнақсыз — қате болмасын):
#    install -d -m 700 /root/.ssh
#    printf '%s\n' 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIA3FFF+IaaAvaxXYeIIOQqZU6udqMjiameY8yhXIcw55 hetzner-raqat' >> /root/.ssh/authorized_keys
#    chmod 600 /root/.ssh/authorized_keys
#    grep GuIdjo9y /root/.ssh/authorized_keys && echo KEY_OK
#
# 3) .env.deploy:
#    RAQAT_VPS_SSH_KEY=C:/Users/YOU/.ssh/id_ed25519
#
# 4) Deploy:
#    powershell -File scripts/deploy_mushaf_cdn_assets.ps1
#    cd mobile && npm run verify:cdn-assets
#
# Host key өзгерсе: ssh-keygen -R 5.75.162.140
