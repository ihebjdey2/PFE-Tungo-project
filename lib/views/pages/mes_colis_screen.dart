import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/colis_viewmodel.dart';
import '../../viewmodels/auth_viewmodel.dart';
import 'suivi_colis_screen.dart';

class MesColisScreen extends StatefulWidget {
  const MesColisScreen({super.key});

  @override
  State<MesColisScreen> createState() => _MesColisScreenState();
}

class _MesColisScreenState extends State<MesColisScreen> {
  @override
  void initState() {
    super.initState();
    final token = Provider.of<AuthViewModel>(context, listen: false).token;
    if (token != null) {
      Provider.of<ColisViewModel>(context, listen: false).fetchColisClient(token);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colisVM = Provider.of<ColisViewModel>(context);
    final token = Provider.of<AuthViewModel>(context, listen: false).token;

    return Scaffold(
      appBar: AppBar(title: const Text('📦 Mes Colis')),
      body: colisVM.isLoadingClient
          ? const Center(child: CircularProgressIndicator())
          : colisVM.colisClient.isEmpty
              ? const Center(child: Text("Aucun colis trouvé"))
              : ListView.builder(
                  itemCount: colisVM.colisClient.length,
                  itemBuilder: (context, index) {
                    final colis = colisVM.colisClient[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      elevation: 4,
                      child: ListTile(
                        title: Text("📦 ${colis.description}"),
                        subtitle: Text("Statut : ${colis.statut}"),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 18),
                        onTap: () async {
  if (token == null) return;

  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (_) => const Center(child: CircularProgressIndicator()),
  );

  final colisDetails = await colisVM.getColisDetails(colis.id, token);

  if (!mounted) return;
  Navigator.pop(context); // fermer le loading

  if (colisDetails != null) {

    Navigator.pushNamed(
      context,
      '/suivi-colis',
      arguments: colisDetails.toJson(),
    );
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Erreur lors du chargement du colis")),
    );
  }
}

                      ),
                    );
                  },
                ),
    );
  }
}
