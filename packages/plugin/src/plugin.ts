// Host-side entry, run by Super Productivity when the plugin is enabled.

PluginAPI.registerHeaderButton({
  label: 'QuestArc',
  icon: 'route',
  onClick: () => PluginAPI.showIndexHtmlAsView(),
});
