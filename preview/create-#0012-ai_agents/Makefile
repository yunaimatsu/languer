.PHONY: chmod-scripts gbc
chmod-scripts:
	@echo "Making all shell scripts in scripts/ executable..."
	@chmod +x scripts/*.sh
	@echo "Done!"

gbc:
	@./scripts/create-branch.sh $(filter-out $@,$(MAKECMDGOALS))

%:
	@:
