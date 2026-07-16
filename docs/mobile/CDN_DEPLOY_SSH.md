# VPS SSH — CDN deploy үшін (бір рет)
#
# 1) Жергілікті public key:
#    type %USERPROFILE%\.ssh\id_ed25519.pub
#
# 2) VPS консолінде (Hetzner) root парольмен:
#    mkdir -p ~/.ssh && echo "PASTE_PUBLIC_KEY" >> ~/.ssh/authorized_keys
#    chmod 600 ~/.ssh/authorized_keys
#
# 3) .env.deploy:
#    RAQAT_VPS_SSH_KEY=C:/Users/YOU/.ssh/id_ed25519
#
# 4) Deploy:
#    powershell -File scripts/deploy_mushaf_cdn_assets.ps1
#    cd mobile && npm run verify:cdn-assets
#
# Host key өзгерсе: ssh-keygen -R 5.75.162.140
