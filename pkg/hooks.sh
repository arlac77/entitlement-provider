post_install() {
	systemctl daemon-reload
	systemctl enable entitlement-provider
	systemctl enable entitlement-provider.socket
	systemctl start entitlement-provider.socket
}

pre_upgrade() {
	systemctl stop entitlement-provider.socket
	systemctl stop entitlement-provider
}

post_upgrade() {
	systemctl daemon-reload
	systemctl start entitlement-provider.socket
}

pre_remove() {
	systemctl stop entitlement-provider.socket
	systemctl disable entitlement-provider.socket
	systemctl stop entitlement-provider
	systemctl disable entitlement-provider
}
